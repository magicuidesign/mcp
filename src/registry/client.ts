import type { ZodType } from "zod";
import type {
  RegistryEntry,
  RegistryExample,
  RegistryExampleDetail,
  RegistryItemDetail,
} from "../domain/registry.js";
import {
  ExampleComponentSchema,
  ExampleDetailSchema,
  RegistryEntrySchema,
  RegistryItemDetailSchema,
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

function parseRegistryEntries(items: unknown[]) {
  return items.flatMap((item) => {
    const parsedEntry = RegistryEntrySchema.safeParse(item);
    return parsedEntry.success ? [parsedEntry.data] : [];
  });
}

export async function fetchRegistryEntries(): Promise<RegistryEntry[]> {
  const registry = await fetchRegistry();
  return parseRegistryEntries(registry.items);
}

export async function fetchRegistryItemDetails(
  name: string,
): Promise<RegistryItemDetail> {
  return fetchJson(
    `${REGISTRY_ITEM_URL}/${name}`,
    RegistryItemDetailSchema,
    `registry item ${name}`,
  );
}

export function parseExampleComponents(entries: RegistryEntry[]): RegistryExample[] {
  return entries.flatMap((item) => {
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
