#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  IndividualComponentSchema,
  fetchComponentDetails,
  fetchExampleComponents,
  fetchExampleDetails,
  fetchUIComponents,
} from "./utils/index.js";
import { formatComponentName } from "./utils/formatters.js";

// Initialize the MCP Server
const server = new McpServer({
  name: "Magic UI MCP",
  version: "1.0.4",
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
  Layout: [
    "bento-grid",
    "dock",
    "file-tree",
    "grid-pattern",
    "interactive-grid-pattern",
    "dot-pattern",
  ],
  Media: [
    "hero-video-dialog",
    "terminal",
    "marquee",
    "script-copy-btn",
    "code-comparison",
  ],
  Motion: [
    "blur-fade",
    "scroll-progress",
    "scroll-based-velocity",
    "orbiting-circles",
    "animated-circular-progress-bar",
  ],
  TextReveal: [
    "text-animate",
    "line-shadow-text",
    "aurora-text",
    "animated-shiny-text",
    "animated-gradient-text",
    "text-reveal",
    "typing-animation",
    "box-reveal",
    "number-ticker",
  ],
  TextEffects: [
    "word-rotate",
    "flip-text",
    "hyper-text",
    "morphing-text",
    "spinning-text",
    "sparkles-text",
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
  Effects: [
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
  Widgets: [
    "animated-list",
    "tweet-card",
    "client-tweet-card",
    "lens",
    "pointer",
    "avatar-circles",
    "icon-cloud",
    "globe",
  ],
  Backgrounds: [
    "warp-background",
    "flickering-grid",
    "animated-grid-pattern",
    "retro-grid",
    "ripple",
  ],
  Devices: [
    "safari",
    "iphone-15-pro",
    "android",
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

      // Generate installation instructions
      const installInstructions = `Install the component using the same process as \
      shadcn/ui. If you run into linter or dependency errors, make sure to install the \
      component using these instructions. For example, with npm/npx: npx shadcn@latest add \
      "https://magicui.design/r/${componentName}.json" (Rules: make sure the URL is wrapped in \
      double quotes and use shadcn not shadcn-ui, or the command will fail). After installation, \ 
      you can import the component like this: import { ${formatComponentName(component.name)} } from \
      "@/components/ui/${componentName}";`;
      
      const disclaimerText = `The code below is for context only. It helps you understand \
      the component's props, types, and behavior. To actually install and use the \
      component, refer to the install instructions above. After installing, the component \
      will be available for import via: import { ${formatComponentName(component.name)} } \
      from "@/components/ui/${componentName}";`;

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
        install: installInstructions,
        content: componentContent && disclaimerText + componentContent,
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