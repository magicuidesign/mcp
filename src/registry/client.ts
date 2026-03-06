import type { ZodType } from "zod";
import type {
  RegistryComponent,
  RegistryComponentDetail,
  RegistryExample,
  RegistryExampleDetail,
} from "../domain/registry.js";
import {
  ComponentDetailSchema,
  ComponentSchema,
  ExampleComponentSchema,
  ExampleDetailSchema,
  RegistryResponseSchema,
} from "./schemas.js";

const REGISTRY_URL = "https://magicui.design/registry.json";
const REGISTRY_ITEM_URL = "https://magicui.design/r";

async function fetchJson<T>(
  url: string,
  schema: ZodType<T>,
  errorLabel: string,
): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${errorLabel}: ${response.statusText} (Status: ${response.status})`,
    );
  }

  const data: unknown = await response.json();
  return schema.parse(data);
}

export async function fetchRegistry() {
  return fetchJson(REGISTRY_URL, RegistryResponseSchema, "registry.json");
}

export async function fetchUIComponents(): Promise<RegistryComponent[]> {
  const registry = await fetchRegistry();

  return registry.items.flatMap((item) => {
    if (item.type !== "registry:ui") {
      return [];
    }

    const parsedComponent = ComponentSchema.safeParse({
      name: item.name,
      type: item.type,
      description: item.description,
    });

    return parsedComponent.success ? [parsedComponent.data] : [];
  });
}

export async function fetchComponentDetails(
  name: string,
): Promise<RegistryComponentDetail> {
  return fetchJson(
    `${REGISTRY_ITEM_URL}/${name}`,
    ComponentDetailSchema,
    `component ${name}`,
  );
}

export async function fetchExampleComponents(): Promise<RegistryExample[]> {
  const registry = await fetchRegistry();

  return registry.items.flatMap((item) => {
    if (item.type !== "registry:example") {
      return [];
    }

    const parsedExample = ExampleComponentSchema.safeParse({
      name: item.name,
      type: item.type,
      description: item.description,
      registryDependencies: item.registryDependencies,
    });

    return parsedExample.success ? [parsedExample.data] : [];
  });
}

export async function fetchExampleDetails(
  exampleName: string,
): Promise<RegistryExampleDetail> {
  return fetchJson(
    `${REGISTRY_ITEM_URL}/${exampleName}`,
    ExampleDetailSchema,
    `example ${exampleName}`,
  );
}
