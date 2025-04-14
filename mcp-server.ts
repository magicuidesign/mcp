import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  IndividualComponentSchema, 
  fetchUIComponents, 
  fetchComponentDetails,
  formatComponentName
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
      console.error("Error fetching MagicUI components:", error);
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

// Register individual tools for each component
async function registerComponentTools() {
  const components = await fetchUIComponents();
  
  for (const component of components) {
    // Format component name to camelCase
    const formattedName = formatComponentName(component.name);
    
    server.tool(
      `get${formattedName}`,
      {},
      async () => {
        try {
          const componentDetails = await fetchComponentDetails(component.name);
          
          // Extract content from the first file
          const content = componentDetails.files[0]?.content;
          
          // Validate with IndividualComponentSchema
          const validatedComponent = IndividualComponentSchema.parse({
            name: component.name,
            type: component.type,
            description: component.description,
            content: content
          });
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(validatedComponent, null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Failed to fetch details for component ${component.name}` 
            }],
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
  console.error("Failed to register component tools:", error);
  // Start the server anyway
  const transport = new StdioServerTransport();
  server.connect(transport);
});