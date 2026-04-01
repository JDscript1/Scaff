import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function run() {
  const transport = new SSEClientTransport(new URL("https://scaff-production-60b9.up.railway.app/sse"));
  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

  try {
    console.log("Conectare la ScaffoldForge...");
    await client.connect(transport);
    console.log("Conectat cu succes!");

    console.log("Apelez list_tools...");
    const tools = await client.listTools();
    console.log("Tool-uri detectate:", tools.tools.length);
    
    console.log("Apelez list_templates...");
    const templates = await client.callTool("list_templates", {});
    console.log("Template-uri disponibile:", JSON.stringify(templates.content, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Eroare la testare:", error);
    process.exit(1);
  }
}

run();
