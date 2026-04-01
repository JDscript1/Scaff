#!/usr/bin/env node
import { ScaffoldForgeServer } from "./server.js";
import { logger } from "./utils/logger.js";

const server = new ScaffoldForgeServer();
server.run().catch((error) => {
  logger.error("Eroare fatală la pornirea serverului:", error);
  process.exit(1);
});
