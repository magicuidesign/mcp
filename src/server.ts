#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  componentCategories,
  getComponentCategoryNames,
} from "./registry/categories.js";
import { registryService } from "./services/registry-service.js";
import { registerGenericTools } from "./tools/register-generic-tools.js";
import { createErrorResponse, createTextResponse } from "./tools/responses.js";

const server = new McpServer({
  name: "Magic UI MCP",
  version: "1.0.4",
});

server.tool(
  "getUIComponents",
  "Deprecated: use listRegistryItems with kind=component instead. Provides a comprehensive list of all Magic UI components.",
  {},
  async () => {
    try {
      const uiComponents = await registryService.listUIComponents();
      return createTextResponse(uiComponents);
    } catch (error) {
      return createErrorResponse("Failed to fetch MagicUI components", error);
    }
  },
);

registerGenericTools(server);

function registerCategoryTools() {
  for (const category of getComponentCategoryNames()) {
    const categoryComponents = componentCategories[category];
    const componentNamesString = categoryComponents.join(", ");

    server.tool(
      `get${category}`,
      `Deprecated: use searchRegistryItems/getRegistryItem instead. Provides implementation details for ${componentNamesString} components.`,
      {},
      async () => {
        try {
          const categoryResults = await registryService.getCategoryComponents(
            category,
          );

          return createTextResponse(categoryResults);
        } catch (error) {
          return createErrorResponse(
            `Error processing ${category} components`,
            error,
          );
        }
      },
    );
  }
}

registerCategoryTools();

const transport = new StdioServerTransport();
server.connect(transport);
