#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGenericTools } from "./tools/register-generic-tools.js";

const server = new McpServer({
  name: "Magic UI MCP",
  version: "1.0.4",
});

registerGenericTools(server);

const transport = new StdioServerTransport();
server.connect(transport);
