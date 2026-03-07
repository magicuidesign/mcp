import { z } from "zod";

export const RegistryEntrySchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  type: z.string(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
});

export const RegistryResponseSchema = z.object({
  items: z.array(z.unknown()),
});

export const ComponentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

const ExampleSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  content: z.string(),
});

export const IndividualComponentSchema = ComponentSchema.extend({
  install: z.string(),
  content: z.string(),
  examples: z.array(ExampleSchema),
});

export const ComponentDetailSchema = z.object({
  name: z.string(),
  type: z.string(),
  files: z.array(
    z.object({
      content: z.string(),
    }),
  ),
});

export const RegistryItemDetailSchema = ComponentDetailSchema;

export const ExampleComponentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  registryDependencies: z.array(z.string()).optional().default([]),
});

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
