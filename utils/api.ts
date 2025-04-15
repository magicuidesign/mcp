import { ComponentSchema, ComponentDetailSchema, ExampleComponentSchema, ExampleDetailSchema } from './schemas.js';

// Function to fetch UI components
export async function fetchUIComponents() {
  try {
    const response = await fetch("https://magicui.design/registry.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch registry.json: ${response.statusText} (Status: ${response.status})`);
    }
    const data = await response.json();
    
    // Filter for base UI items only
    return data.items
      .filter((item: any) => item.type === "registry:ui")
      .map((item: any) => {
        try {
          return ComponentSchema.parse({
            name: item.name,
            type: item.type,
            description: item.description,
          });
        } catch (parseError) {
          // console.error(`Failed to parse component item: ${item?.name || 'unknown'}`, parseError, item); // Log the problematic item (optional, keep commented for now)
          return null; // Return null for items that fail parsing
        }
      })

  } catch (error) {
    // console.error("Error fetching MagicUI components:", error); // Keep commented out
    // Still return empty array on outer fetch/parse errors
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

// Function to fetch example components 
export async function fetchExampleComponents() {
  try {
    const response = await fetch("https://magicui.design/registry.json");
    const data = await response.json();
    
    // Filter for example items only
    return data.items
      .filter((item: any) => item.type === "registry:example")
      .map((item: any) => {
        return ExampleComponentSchema.parse({
          name: item.name,
          type: item.type,
          description: item.description,
          registryDependencies: item.registryDependencies
        });
      });

  } catch (error) {
    console.error("Error fetching MagicUI example components:", error);
    return [];
  }
}

// Function to fetch details for a specific example
export async function fetchExampleDetails(exampleName: string) {
  try {
    const response = await fetch(`https://magicui.design/r/${exampleName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch example details for ${exampleName}: ${response.statusText}`);
    }
    const data = await response.json();
    return ExampleDetailSchema.parse(data);
  } catch (error) {
    console.error(`Error fetching example details for ${exampleName}:`, error);
    throw error;
  }
} 