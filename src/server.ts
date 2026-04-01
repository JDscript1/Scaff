import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logger } from "./utils/logger.js";
import { ToolSchemas } from "./types/schemas.js";
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ProjectDetector } from "./core/project-detector.js";
import { Planner } from "./core/planner.js";
import { Executor } from "./core/executor.js";
import { FileSystemService } from "./filesystem/vfs.js";
import { Validator } from "./core/validator.js";

export class ScaffoldForgeServer {
  private server: Server;
  private planner: Planner;

  constructor() {
    this.server = new Server(
      { name: "scaffold-forge-mcp", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    this.planner = new Planner();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Object.entries(ToolSchemas).map(([name, schema]) => ({
        name,
        description: (schema as any).description || `Tool: ${name}`,
        inputSchema: zodToJsonSchema(schema),
      })),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Tool apelat: ${name}`);

      try {
        const schema = ToolSchemas[name];
        if (!schema) throw new Error(`Tool necunoscut: ${name}`);

        const validatedArgs = schema.parse(args || {});

        // --- DISCOVERY ---
        if (name === "list_templates") {
          const __dirname = path.dirname(fileURLToPath(import.meta.url));
          const templatesDir = path.resolve(__dirname, '..', 'templates');
          const stacks = await fs.readdir(templatesDir);
          
          const result: any = {};
          for (const s of stacks) {
            if ((validatedArgs as any).stack && s !== (validatedArgs as any).stack) continue;
            const stat = await fs.stat(path.join(templatesDir, s));
            if (stat.isDirectory()) {
              const files = await fs.readdir(path.join(templatesDir, s));
              result[s] = files.map(f => f.replace('.hbs', ''));
            }
          }
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        // --- PREVIEW ---
        if (name === "preview_generation_plan") {
          const previewArgs = validatedArgs as any;
          const targetPath = (previewArgs.payload as any).targetPath || ".";
          const profile = await ProjectDetector.detect(targetPath);
          const plan = await this.planner.createPlan(previewArgs.requestType, profile, previewArgs.payload);
          
          return { content: [{ type: "text", text: JSON.stringify({ 
            message: "PREVIEW ONLY: Nicio modificare nu a fost aplicată pe disc.",
            plan 
          }, null, 2) }] };
        }

        // --- EXECUTION ---
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
        const errorMessage = error.errors 
          ? `Eroare validare: ${JSON.stringify(error.errors)}` 
          : error.message;

        logger.error(`Eroare la procesare ${name}: ${errorMessage}`);
        
        return { 
          content: [{ type: "text", text: errorMessage }], 
          isError: true 
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info("ScaffoldForge MCP Server pregătit.");
  }
}
