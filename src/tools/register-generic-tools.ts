import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { registryService } from "../services/registry-service.js";
import { createErrorResponse, createTextResponse } from "./responses.js";

const listRegistryItemsSchema = {
  kind: z
    .string()
    .optional()
    .describe(
      "Kind of item to list, such as component, example, style, or a raw registry type like registry:ui. Defaults to component.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Maximum number of items to return. Defaults to all matching items."),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Pagination offset. Defaults to 0."),
};

const getRegistryItemSchema = {
  name: z
    .string()
    .describe(
      "Registry item name from listRegistryItems, for example marquee. The @magicui/marquee form and the item registryUrl are also accepted.",
    ),
  includeSource: z
    .boolean()
    .optional()
    .describe("Include the item's source code content."),
  includeExamples: z
    .boolean()
    .optional()
    .describe("Include related example code when the item is a component."),
  includeRelated: z
    .boolean()
    .optional()
    .describe("Include related registry items such as examples or dependencies."),
};

const readOnlyRegistryToolAnnotations: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

export function registerGenericTools(server: McpServer) {
  server.registerTool(
    "listRegistryItems",
    {
      description:
        "Lists the name and description of Magic UI registry items, all components by default. Pick the items that fit from this list, then call getRegistryItem for install instructions, source, and examples.",
      inputSchema: listRegistryItemsSchema,
      annotations: readOnlyRegistryToolAnnotations,
    },
    async (args) => {
      try {
        const result = await registryService.listRegistryItems(args);
        return createTextResponse(result);
      } catch (error) {
        return createErrorResponse("Failed to list registry items", error);
      }
    },
  );

  server.registerTool(
    "getRegistryItem",
    {
      description: "Gets detailed information for a single Magic UI registry item.",
      inputSchema: getRegistryItemSchema,
      annotations: readOnlyRegistryToolAnnotations,
    },
    async (args) => {
      try {
        const result = await registryService.getRegistryItem(args.name, {
          includeSource: args.includeSource,
          includeExamples: args.includeExamples,
          includeRelated: args.includeRelated,
        });
        return createTextResponse(result);
      } catch (error) {
        return createErrorResponse(
          `Failed to fetch registry item ${args.name}`,
          error,
        );
      }
    },
  );
}
