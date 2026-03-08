import type { z } from "zod";
import type {
  ExampleComponentSchema,
  ExampleDetailSchema,
  RegistryEntrySchema,
  RegistryItemDetailSchema,
} from "../registry/schemas.js";

export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;
export type RegistryExample = z.infer<typeof ExampleComponentSchema>;
export type RegistryExampleDetail = z.infer<typeof ExampleDetailSchema>;
export type RegistryItemDetail = z.infer<typeof RegistryItemDetailSchema>;

export type RegistryCatalogItem = {
  name: string;
  title: string;
  description?: string;
  kind: string;
  registryType: string;
};

export type RegistryCatalogItemDetail = RegistryCatalogItem & {
  install: {
    command: string;
    registryUrl: string;
  };
  dependencies: string[];
  registryDependencies: string[];
  relatedItems?: RegistryCatalogItem[];
  source?: string;
  examples?: Array<{
    name: string;
    title: string;
    description?: string;
    content: string;
  }>;
};

export type RegistrySnapshot = {
  entries: RegistryEntry[];
  examples: RegistryExample[];
  exampleNamesByComponent: Map<string, string[]>;
};
