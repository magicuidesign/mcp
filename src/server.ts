#!/usr/bin/env node

import {
  IndividualComponentSchema,
  fetchComponentDetails,
  fetchExampleComponents,
  fetchExampleDetails,
  fetchUIComponents,
} from "@/utils/index";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Initialize the MCP Server
const server = new McpServer({
  name: "Magic UI MCP",
  version: "1.0.0",
});

// Register the main tool for getting all components
server.tool(
  "getUIComponents",
  "Provides a comprehensive list of all Magic UI components.",
  {},
  async () => {
    try {
      const uiComponents = await fetchUIComponents();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(uiComponents, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to fetch MagicUI components",
          },
        ],
        isError: true,
      };
    }
  },
);

// Maps component names to their example implementations
function buildExampleComponentMap(
  allExampleComponents: Array<{
    name: string;
    registryDependencies?: string[];
  }>,
): Map<string, string[]> {
  const exampleMap = new Map<string, string[]>();

  for (const example of allExampleComponents) {
    if (
      example.registryDependencies &&
      Array.isArray(example.registryDependencies)
    ) {
      for (const depUrl of example.registryDependencies) {
        if (typeof depUrl === "string" && depUrl.includes("magicui.design")) {
          const componentNameMatch = depUrl.match(/\/r\/([^\/]+)$/);
          if (componentNameMatch && componentNameMatch[1]) {
            const componentName = componentNameMatch[1];
            if (!exampleMap.has(componentName)) {
              exampleMap.set(componentName, []);
            }
            if (!exampleMap.get(componentName)?.includes(example.name)) {
              exampleMap.get(componentName)?.push(example.name);
            }
          }
        }
      }
    }
  }
  return exampleMap;
}

// Component category definitions
const componentCategories = {
  Components: [
    "marquee",
    "terminal",
    "hero-video-dialog",
    "bento-grid",
    "animated-list",
    "dock",
    "globe",
    "tweet-card",
    "client-tweet-card",
    "orbiting-circles",
    "avatar-circles",
    "icon-cloud",
    "animated-circular-progress-bar",
    "file-tree",
    "code-comparison",
    "script-copy-btn",
    "scroll-progress",
    "lens",
    "pointer",
  ],
  DeviceMocks: ["safari", "iphone-15-pro", "android"],
  SpecialEffects: [
    "animated-beam",
    "border-beam",
    "shine-border",
    "magic-card",
    "meteors",
    "neon-gradient-card",
    "confetti",
    "particles",
    "cool-mode",
    "scratch-to-reveal",
  ],
  Animations: ["blur-fade"],
  TextAnimations: [
    "text-animate",
    "line-shadow-text",
    "aurora-text",
    "number-ticker",
    "animated-shiny-text",
    "animated-gradient-text",
    "text-reveal",
    "hyper-text",
    "word-rotate",
    "typing-animation",
    "scroll-based-velocity",
    "flip-text",
    "box-reveal",
    "sparkles-text",
    "morphing-text",
    "spinning-text",
  ],
  Buttons: [
    "rainbow-button",
    "shimmer-button",
    "shiny-button",
    "interactive-hover-button",
    "animated-subscribe-button",
    "pulsating-button",
    "ripple-button",
  ],
  Backgrounds: [
    "warp-background",
    "flickering-grid",
    "animated-grid-pattern",
    "retro-grid",
    "ripple",
    "dot-pattern",
    "grid-pattern",
    "interactive-grid-pattern",
  ],
};

// Fetches detailed information about components in a specific category
async function fetchComponentsByCategory(
  categoryComponents: string[],
  allComponents: any[],
  exampleNamesByComponent: Map<string, string[]>,
) {
  const componentResults = [];

  for (const componentName of categoryComponents) {
    const component = allComponents.find((c) => c.name === componentName);
    if (!component) continue;

    try {
      const componentDetails = await fetchComponentDetails(componentName);
      const componentContent = componentDetails.files[0]?.content;

      const relevantExampleNames =
        exampleNamesByComponent.get(componentName) || [];
      const exampleDetailsList = await Promise.all(
        relevantExampleNames.map((name) => fetchExampleDetails(name)),
      );

      const formattedExamples = exampleDetailsList
        .filter((details) => details !== null)
        .map((details) => ({
          name: details.name,
          type: details.type,
          description: details.description,
          content: details.files[0]?.content,
        }));

      const validatedComponent = IndividualComponentSchema.parse({
        name: component.name,
        type: component.type,
        description: component.description,
        content: componentContent,
        examples: formattedExamples,
      });

      componentResults.push(validatedComponent);
    } catch (error) {
      console.error(`Error processing component ${componentName}:`, error);
    }
  }

  return componentResults;
}

// Registers tools for each component category
async function registerCategoryTools() {
  const [components, allExampleComponents] = await Promise.all([
    fetchUIComponents(),
    fetchExampleComponents(),
  ]);

  const exampleNamesByComponent =
    buildExampleComponentMap(allExampleComponents);

  for (const [category, categoryComponents] of Object.entries(
    componentCategories,
  )) {
    const componentNamesString = categoryComponents.join(", ");

    server.tool(
      `get${category}`,
      `Provides implementation details for ${componentNamesString} components.`,
      {},
      async () => {
        try {
          const categoryResults = await fetchComponentsByCategory(
            categoryComponents,
            components,
            exampleNamesByComponent,
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(categoryResults, null, 2),
              },
            ],
          };
        } catch (error) {
          let errorMessage = `Error processing ${category} components`;
          if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
          }
          return {
            content: [{ type: "text", text: errorMessage }],
            isError: true,
          };
        }
      },
    );
  }
}

// Initialize category tools before starting the server
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
