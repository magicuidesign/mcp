import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Initialize the MCP Server
const server = new McpServer({
  name: "MagicUI MCP",
  version: "1.0.0"
});

// Define simplified schema for component response
const ComponentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

// Define schema for individual component with content
const IndividualComponentSchema = ComponentSchema.extend({
  content: z.string(),
});

// Define schema for component detail response
const ComponentDetailSchema = z.object({
  name: z.string(),
  type: z.string(),
  files: z.array(z.object({
    content: z.string(),
    type: z.string(),
    path: z.string(),
    target: z.string(),
  })),
});

// Function to fetch UI components
async function fetchUIComponents() {
  try {
    const response = await fetch("https://magicui.design/registry.json");
    const data = await response.json();
    
    // Filter for base UI items only
    return data.items
      .filter((item: any) => item.type === "registry:ui")
      .map((item: any) => {
        // Validate each component with the schema
        return ComponentSchema.parse({
          name: item.name,
          type: item.type,
          description: item.description,
        });
      });
  } catch (error) {
    console.error("Error fetching MagicUI components:", error);
    return [];
  }
}

// Function to fetch individual component details
async function fetchComponentDetails(name: string) {
  try {
    const response = await fetch(`https://magicui.design/r/${name}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch component ${name}: ${response.statusText}`);
    }
    const data = await response.json();
    return ComponentDetailSchema.parse(data);
  } catch (error) {
    console.error(`Error fetching component ${name}:`, error);
    throw error;
  }
}

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
          const content = componentDetails.files[0]?.content || "";
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                name: component.name,
                type: component.type,
                description: component.description,
                content: content
              }, null, 2) 
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

// Helper function to format component names
function formatComponentName(name: string): string {
  return name
    .split('-').map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('');
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