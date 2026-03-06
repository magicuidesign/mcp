import type { z } from "zod";
import type {
  ComponentDetailSchema,
  ComponentSchema,
  ExampleComponentSchema,
  ExampleDetailSchema,
  IndividualComponentSchema,
} from "../registry/schemas.js";

export type RegistryComponent = z.infer<typeof ComponentSchema>;
export type RegistryComponentDetail = z.infer<typeof ComponentDetailSchema>;
export type RegistryExample = z.infer<typeof ExampleComponentSchema>;
export type RegistryExampleDetail = z.infer<typeof ExampleDetailSchema>;
export type RegistryEnrichedComponent = z.infer<typeof IndividualComponentSchema>;

export type RegistrySnapshot = {
  components: RegistryComponent[];
  examples: RegistryExample[];
  exampleNamesByComponent: Map<string, string[]>;
};
