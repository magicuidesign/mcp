#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  componentCategories,
  getComponentCategoryNames,
} from "./registry/categories.js";
import { registryService } from "./services/registry-service.js";

const server = new McpServer({
  name: "Magic UI MCP",
  version: "1.0.4",
});

function createTextResponse(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function createErrorResponse(message: string, error?: unknown) {
  let errorMessage = message;

  if (error instanceof Error) {
    errorMessage += `: ${error.message}`;
  }

  return {
    content: [{ type: "text" as const, text: errorMessage }],
    isError: true,
  };
}

server.tool(
  "getUIComponents",
  "Provides a comprehensive list of all Magic UI components.",
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

async function registerCategoryTools() {
  const snapshot = await registryService.createSnapshot();

  for (const category of getComponentCategoryNames()) {
    const categoryComponents = componentCategories[category];
    const componentNamesString = categoryComponents.join(", ");

    server.tool(
      `get${category}`,
      `Provides implementation details for ${componentNamesString} components.`,
      {},
      async () => {
        try {
          const categoryResults = await registryService.getCategoryComponents(
            category,
            snapshot,
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

registerCategoryTools()
  .then(() => {
    const transport = new StdioServerTransport();
    server.connect(transport);
  })
  .catch((error) => {
    console.error("Error registering category tools:", error);
    const transport = new StdioServerTransport();
    server.connect(transport);
  });
