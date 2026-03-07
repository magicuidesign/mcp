import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registryService } from "../services/registry-service.js";
import { createErrorResponse, createTextResponse } from "./responses.js";

const listRegistryItemsSchema = {
  kind: z
    .string()
    .optional()
    .describe(
      "Optional kind filter such as component, example, style, or a raw registry type like registry:ui.",
    ),
  query: z
    .string()
    .optional()
    .describe(
      "Optional text filter applied to names, titles, descriptions, and categories.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(150)
    .optional()
    .describe("Maximum number of items to return. Defaults to 25."),
};

const getRegistryItemSchema = {
  name: z.string().describe("Exact registry item name, for example marquee."),
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

const searchRegistryItemsSchema = {
  query: z
    .string()
    .min(1)
    .describe(
      "Search query matched against names, titles, descriptions, and categories.",
    ),
  kind: z
    .string()
    .optional()
    .describe("Optional kind filter such as component, example, or style."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(150)
    .optional()
    .describe("Maximum number of results to return. Defaults to 25."),
};

export function registerGenericTools(server: McpServer) {
  server.tool(
    "listRegistryItems",
    "Lists Magic UI registry items with optional filtering by kind, query, and limit.",
    listRegistryItemsSchema,
    async (args) => {
      try {
        const result = await registryService.listRegistryItems(args);
        return createTextResponse(result);
      } catch (error) {
        return createErrorResponse("Failed to list registry items", error);
      }
    },
  );

  server.tool(
    "getRegistryItem",
    "Gets detailed information for a single Magic UI registry item.",
    getRegistryItemSchema,
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

  server.tool(
    "searchRegistryItems",
    "Searches Magic UI registry items by keyword or use case.",
    searchRegistryItemsSchema,
    async (args) => {
      try {
        const result = await registryService.searchRegistryItems(args);
        return createTextResponse(result);
      } catch (error) {
        return createErrorResponse("Failed to search registry items", error);
      }
    },
  );
}
