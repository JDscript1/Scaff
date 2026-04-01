import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logger } from "./utils/logger.js";
import { ToolSchemas } from "./types/schemas.js";
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from "express";
import cors from "cors";

import { ProjectDetector } from "./core/project-detector.js";
import { Planner } from "./core/planner.js";
import { Executor } from "./core/executor.js";
import { FileSystemService } from "./filesystem/vfs.js";
import { Validator } from "./core/validator.js";

export class ScaffoldForgeServer {
  private planner: Planner;
  private sessions = new Map<string, { server: Server; transport: SSEServerTransport }>();

  constructor() {
    this.planner = new Planner();
  }

  private createSessionServer(): Server {
    const server = new Server(
      { name: "scaffold-forge-mcp", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Object.entries(ToolSchemas).map(([name, schema]) => ({
        name,
        description: (schema as any).description || `Tool: ${name}`,
        inputSchema: zodToJsonSchema(schema),
      })),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info(`[Session] Executare tool: ${name}`);

      try {
        const schema = ToolSchemas[name];
        if (!schema) throw new Error(`Tool necunoscut: ${name}`);
        const validatedArgs = schema.parse(args || {});

        if (name === "list_templates") {
          const __dirname = path.dirname(fileURLToPath(import.meta.url));
          const builtTemplatesDir = path.resolve(__dirname, '..', 'templates');
          const sourceTemplatesDir = path.resolve(__dirname, '..', 'src', 'templates');
          const templatesDir = existsSync(builtTemplatesDir) ? builtTemplatesDir : sourceTemplatesDir;
          const stacks = await fs.readdir(templatesDir);
          const result: any = {};
          for (const s of stacks) {
            const fullStackPath = path.join(templatesDir, s);
            try {
              const stat = await fs.stat(fullStackPath);
              if (stat.isDirectory()) {
                const files = await fs.readdir(fullStackPath);
                result[s] = files.filter(f => f.endsWith('.hbs')).map(f => f.replace('.hbs', ''));
              }
            } catch (e) {}
          }
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        if (name === "preview_generation_plan") {
          const previewArgs = validatedArgs as any;
          const targetPath = (previewArgs.payload as any).targetPath || ".";
          const profile = await ProjectDetector.detect(targetPath);
          const plan = await this.planner.createPlan(previewArgs.requestType, profile, previewArgs.payload);
          return { content: [{ type: "text", text: JSON.stringify({ message: "PREVIEW ONLY", plan }, null, 2) }] };
        }

        const targetPath = (validatedArgs as any).targetPath || ".";
        const isDryRun = (validatedArgs as any).options?.dryRun || false;
        const vfs = new FileSystemService(isDryRun, targetPath);
        const executor = new Executor(vfs);
        const profile = await ProjectDetector.detect(targetPath);
        
        Validator.validateCompatibility(name, profile, validatedArgs);

        if (name === "inspect_project_structure") {
          return { content: [{ type: "text", text: JSON.stringify(profile, null, 2) }] };
        }

        const plan = await this.planner.createPlan(name, profile, validatedArgs);
        const result = await executor.execute(plan);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };

      } catch (error: any) {
        const errorMessage = error.errors ? `Eroare validare: ${JSON.stringify(error.errors)}` : error.message;
        logger.error(`[Session] Eroare tool ${name}: ${errorMessage}`);
        return { content: [{ type: "text", text: errorMessage }], isError: true };
      }
    });

    return server;
  }

  async run() {
    const port = process.env.PORT ? parseInt(process.env.PORT) : null;

    if (port) {
      const app = express();
      app.use(cors());
      // IMPORTANT: do not attach express.json() globally here.
      // The MCP SSE transport expects the raw request stream on /messages.

      app.get("/", (req, res) => {
        res.send("ScaffoldForge Multi-Session Server Active. Connect via SSE at /sse");
      });

      app.get("/sse", async (req, res) => {
        try {
          logger.info("Conexiune SSE nouă detectată.");
          res.setHeader('X-Accel-Buffering', 'no');
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const transport = new SSEServerTransport("/messages", res);
          const server = this.createSessionServer();
          await server.connect(transport);

          const sessionId = transport.sessionId;
          this.sessions.set(sessionId, { server, transport });

          res.on('close', async () => {
            logger.info(`Închidere sesiune: ${sessionId}`);
            this.sessions.delete(sessionId);
            try {
              await server.close();
            } catch (error) {
              logger.warn(`Nu am putut închide curat sesiunea ${sessionId}:`, error);
            }
          });
        } catch (error) {
          logger.error("Eroare la inițializarea sesiunii SSE:", error);
          if (!res.headersSent) {
            res.status(500).send("Failed to initialize SSE session");
          } else {
            res.end();
          }
        }
      });

      app.post("/messages", async (req, res) => {
        const sessionIdQuery = req.query.sessionId;
        const sessionId = typeof sessionIdQuery === "string"
          ? sessionIdQuery
          : Array.isArray(sessionIdQuery) && typeof sessionIdQuery[0] === "string"
            ? sessionIdQuery[0]
            : undefined;
        if (!sessionId) {
          return res.status(400).send("Missing sessionId query param.");
        }

        const session = this.sessions.get(sessionId);
        if (!session) return res.status(400).send("No active SSE session.");

        try {
          await session.transport.handlePostMessage(req, res);
        } catch (error) {
          logger.error(`Eroare la procesarea mesajului pentru ${sessionId}:`, error);
          res.status(500).send("Internal Error");
        }
      });

      app.listen(port, "0.0.0.0", () => {
        logger.info(`Server Cloud pornit pe portul ${port}`);
      });
    } else {
      const server = this.createSessionServer();
      const transport = new StdioServerTransport();
      await server.connect(transport);
      logger.info("ScaffoldForge (Stdio) pornit local.");
    }
  }
}
