import { ComponentSchema, ComponentDetailSchema } from './schemas.js';

// Function to fetch UI components
export async function fetchUIComponents() {
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
export async function fetchComponentDetails(name: string) {
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