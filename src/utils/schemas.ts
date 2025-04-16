import { z } from "zod";

// Define schema for general component
export const ComponentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(), // Only optional because of interactive-hover-button
});

// Define schema for an individual example
const ExampleSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  content: z.string(),
});

// Define schema for individual component with content and examples
export const IndividualComponentSchema = ComponentSchema.extend({
  install: z.string(),
  content: z.string(),
  examples: z.array(ExampleSchema),
});

// Define schema for component detail response
export const ComponentDetailSchema = z.object({
  name: z.string(),
  type: z.string(),
  files: z.array(
    z.object({
      content: z.string(),
    }),
  ),
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
  files: z.array(
    z.object({
      content: z.string(),
    }),
  ),
});
