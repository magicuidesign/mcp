import { z } from "zod";

// Define simplified schema for component response
export const ComponentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

// Define schema for individual component with content
export const IndividualComponentSchema = ComponentSchema.extend({
  content: z.string(),
});

// Define schema for component detail response
export const ComponentDetailSchema = z.object({
  name: z.string(),
  type: z.string(),
  files: z.array(z.object({
    content: z.string(),
    type: z.string(),
    path: z.string(),
    target: z.string(),
  })),
}); 