import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  IndividualComponentSchema, 
  fetchUIComponents, 
  fetchComponentDetails,
  formatComponentName,
  fetchExampleComponents,
  fetchExampleDetails
} from "./utils/index.js";

// Initialize the MCP Server
const server = new McpServer({
  name: "MagicUI MCP",
  version: "1.0.0"
});

// Register the main tool for getting all components
server.tool(
  "getUIComponents",
  {},
  async () => {
    try {
      const uiComponents = await fetchUIComponents();
      
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(uiComponents, null, 2) 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: "Failed to fetch MagicUI components" 
        }],
        isError: true
      };
    }
  }
);

// Helper function to build the map linking component names to example names
function buildExampleComponentMap(
  allExampleComponents: Array<{ name: string; registryDependencies?: string[] }>
): Map<string, string[]> {
  const exampleMap = new Map<string, string[]>();

  for (const example of allExampleComponents) {
    if (example.registryDependencies && Array.isArray(example.registryDependencies)) {
      for (const depUrl of example.registryDependencies) {
        if (typeof depUrl === 'string' && depUrl.includes("magicui.design")) {
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

// Register individual tools for each component
async function registerComponentTools() {
  // Fetch UI components and Example components metadata concurrently
  const [components, allExampleComponents] = await Promise.all([
    fetchUIComponents(),
    fetchExampleComponents()
  ]);

  // Use the helper function to build the map
  const exampleNamesByComponent = buildExampleComponentMap(allExampleComponents);

  // Register tools for each UI component
  for (const component of components) {
    // Format component name to camelCase
    const formattedName = formatComponentName(component.name);
    
    server.tool(
      `get${formattedName}`,
      {},
      async () => {
        try {
          // Fetch main component details (code)
          const componentDetails = await fetchComponentDetails(component.name);
          const componentContent = componentDetails.files[0]?.content;

          // 1. Look up associated example names
          const relevantExampleNames = exampleNamesByComponent.get(component.name) || [];

          // 2. Fetch full details (including content) for each relevant example
          const exampleDetailsList = await Promise.all(
            relevantExampleNames.map(name => fetchExampleDetails(name))
          );

          // 3. Format examples for the final output schema (ExampleSchema)
          const formattedExamples = exampleDetailsList
            .filter(details => details !== null) 
            .map(details => ({
              name: details.name,
              type: details.type,
              description: details.description,
              content: details.files[0]?.content,
            }));

          // 4. Validate final structure, including the formatted examples
          const validatedComponent = IndividualComponentSchema.parse({
            name: component.name,
            type: component.type,
            description: component.description,
            content: componentContent, // Main component content
            examples: formattedExamples // Pass the processed examples
          });
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(validatedComponent, null, 2) 
            }]
          };
        } catch (error) {
          // Handle potential errors during fetch or parse
          let errorMessage = `Error processing component ${component.name}`;
          if (error instanceof Error) {
             errorMessage += `: ${error.message}`;
          }
          return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
          };
        }
      }
    );
  }
}

// Initialize component tools before starting the server
registerComponentTools().then(() => {
  // Start the server with stdio transport
  const transport = new StdioServerTransport();
  server.connect(transport);
}).catch(error => {
  // Start the server anyway
  const transport = new StdioServerTransport();
  server.connect(transport);
});