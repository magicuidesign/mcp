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
  const [components, allExampleComponents] = await Promise.all([
    fetchUIComponents(),
    fetchExampleComponents()
  ]);

  const exampleNamesByComponent = buildExampleComponentMap(allExampleComponents);

  for (const component of components) {
    const formattedName = formatComponentName(component.name);
    
    server.tool(
      `get${formattedName}`,
      {},
      async () => {
        try {
          const componentDetails = await fetchComponentDetails(component.name);
          const componentContent = componentDetails.files[0]?.content;

          const relevantExampleNames = exampleNamesByComponent.get(component.name) || [];

          const exampleDetailsList = await Promise.all(
            relevantExampleNames.map(name => fetchExampleDetails(name))
          );

          const formattedExamples = exampleDetailsList
            .filter(details => details !== null) 
            .map(details => ({
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
            examples: formattedExamples
          });
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(validatedComponent, null, 2) 
            }]
          };
        } catch (error) {
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
  const transport = new StdioServerTransport();
  server.connect(transport);
}).catch(error => {
  const transport = new StdioServerTransport();
  server.connect(transport);
});