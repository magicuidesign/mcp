import type { z } from "zod";
import type {
  ComponentDetailSchema,
  ComponentSchema,
  ExampleComponentSchema,
  ExampleDetailSchema,
  IndividualComponentSchema,
  RegistryEntrySchema,
  RegistryItemDetailSchema,
} from "../registry/schemas.js";

export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;
export type RegistryComponent = z.infer<typeof ComponentSchema>;
export type RegistryComponentDetail = z.infer<typeof ComponentDetailSchema>;
export type RegistryExample = z.infer<typeof ExampleComponentSchema>;
export type RegistryExampleDetail = z.infer<typeof ExampleDetailSchema>;
export type RegistryEnrichedComponent = z.infer<typeof IndividualComponentSchema>;
export type RegistryItemDetail = z.infer<typeof RegistryItemDetailSchema>;

export type RegistryCatalogItem = {
  name: string;
  title: string;
  description?: string;
  kind: string;
  registryType: string;
  categories: string[];
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
  components: RegistryComponent[];
  examples: RegistryExample[];
  exampleNamesByComponent: Map<string, string[]>;
};
