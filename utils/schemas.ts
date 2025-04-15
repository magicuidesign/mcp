import { z } from "zod";

// Define schema for general component
export const ComponentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

// Define schema for an individual example
const ExampleSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
});

// Define schema for individual component with content and examples
export const IndividualComponentSchema = ComponentSchema.extend({
  content: z.string(),
  examples: z.array(ExampleSchema).optional(),
});

// Define schema for component detail response
export const ComponentDetailSchema = z.object({
  name: z.string(),
  type: z.string(),
  files: z.array(z.object({
    content: z.string(),
  })),
}); 

// Define schema for example component
export const ExampleComponentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  registryDependencies: z.array(z.string()),
});

// Define schema for example detail response
export const ExampleDetailSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  files: z.array(z.object({
    content: z.string(),
  })),
});