#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGenericTools } from "./tools/register-generic-tools.js";
import packageJson from "../package.json" with { type: "json" };

const server = new McpServer({
  name: "Magic UI MCP",
  version: packageJson.version,
});

registerGenericTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
