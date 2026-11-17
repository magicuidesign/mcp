import type {
  RegistryCatalogItem,
  RegistryCatalogItemDetail,
  RegistryEntry,
  RegistryExample,
  RegistryItemDetail,
  RegistrySnapshot,
} from "../domain/registry.js";
import {
  REGISTRY_ITEM_BASE_URL,
  buildRegistryItemUrl,
  fetchExampleDetails,
  fetchRegistryEntries,
  fetchRegistryItemDetails,
  parseExampleComponents,
} from "../registry/client.js";
import { formatDisplayName } from "../utils/formatters.js";
import type {
  BuildFilesSourceOptions,
  GetRegistryItemOptions,
  ListRegistryItemsParams,
  ListRegistryItemsResult,
  PaginateItemsParams,
  PaginateItemsResult,
} from "./types.js";

const DEFAULT_LIST_KIND = "component";
const SNAPSHOT_MAX_AGE_MS = 10 * 60 * 1000;
const SNAPSHOT_RETRY_DELAY_MS = 60 * 1000;

export class RegistryService {
  private snapshot?: RegistrySnapshot;
  private snapshotRefreshAt = 0;
  private snapshotPromise?: Promise<RegistrySnapshot>;

  // Serves the cached catalog and refreshes it in the background once it is
  // older than SNAPSHOT_MAX_AGE_MS. A failed refresh keeps the last good
  // snapshot and is retried after SNAPSHOT_RETRY_DELAY_MS.
  async createSnapshot(): Promise<RegistrySnapshot> {
    if (!this.snapshot) {
      return this.refreshSnapshot();
    }

    if (!this.snapshotPromise && Date.now() >= this.snapshotRefreshAt) {
      this.refreshSnapshot().catch((error) => {
        this.snapshotRefreshAt = Date.now() + SNAPSHOT_RETRY_DELAY_MS;
        console.error("Error refreshing registry catalog, keeping cached copy:", error);
      });
    }

    return this.snapshot;
  }

  private refreshSnapshot(): Promise<RegistrySnapshot> {
    this.snapshotPromise ??= this.loadSnapshot();
    return this.snapshotPromise;
  }

  private async loadSnapshot(): Promise<RegistrySnapshot> {
    try {
      const entries = await fetchRegistryEntries();
      const examples = parseExampleComponents(entries);

      const snapshot = {
        entries,
        examples,
        exampleNamesByComponent: this.buildExampleComponentMap(examples),
      };

      this.snapshot = snapshot;
      this.snapshotRefreshAt = Date.now() + SNAPSHOT_MAX_AGE_MS;
      return snapshot;
    } finally {
      this.snapshotPromise = undefined;
    }
  }

  async listRegistryItems(
    options?: ListRegistryItemsParams,
  ): ListRegistryItemsResult {
    const snapshot = await this.createSnapshot();
    const catalog = this.buildCatalog(snapshot);
    const kind = options?.kind?.trim().toLowerCase() || DEFAULT_LIST_KIND;
    const matchingItems = catalog
      .filter(
        (item) =>
          item.kind.toLowerCase() === kind ||
          item.registryType.toLowerCase() === kind,
      )
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(({ name, description }) => ({ name, description }));
    const page = this.paginateItems({ items: matchingItems, options });

    const result: Awaited<ListRegistryItemsResult> = {
      total: matchingItems.length,
      limit: page.limit,
      offset: page.offset,
      hasMore: page.hasMore,
      nextOffset: page.nextOffset,
      availableKinds: this.getAvailableKinds(catalog),
      items: page.items,
    };

    return result;
  }

  async getRegistryItem(
    name: string,
    options?: GetRegistryItemOptions,
  ): Promise<RegistryCatalogItemDetail> {
    const snapshot = await this.createSnapshot();
    const catalog = this.buildCatalog(snapshot);
    const requestedName = [`${REGISTRY_ITEM_BASE_URL}/`, "@magicui/"]
      .reduce(
        (value, prefix) =>
          value.startsWith(prefix) ? value.slice(prefix.length) : value,
        name.trim().toLowerCase(),
      )
      .replace(/\.json$/, "");
    const item = catalog.find(
      (entry) => entry.name.toLowerCase() === requestedName,
    );

    if (!item) {
      throw new Error(`Registry item "${name}" was not found`);
    }

    const detail: RegistryCatalogItemDetail = {
      ...item,
      install: {
        command: this.buildRegistryInstallCommand(item.name),
        registryUrl: buildRegistryItemUrl(item.name),
      },
      dependencies: this.getEntryDependencies(snapshot.entries, item.name),
      registryDependencies: this.getEntryRegistryDependencies(snapshot.entries, item.name),
    };

    const warnings: string[] = [];

    if (options?.includeRelated) {
      detail.relatedItems = this.getRelatedItems(item, catalog, snapshot);
    }

    if (options?.includeSource) {
      try {
        const itemDetails = await this.fetchRegistryItemDetails(item.name);
        const source = this.buildRegistryItemSource(item, itemDetails);

        if (source) {
          detail.source = source;
        }
      } catch (error) {
        console.error(`Error fetching source for registry item ${item.name}:`, error);
        warnings.push(`Failed to fetch source for ${item.name}: ${getErrorMessage(error)}`);
      }
    }

    if (options?.includeExamples && item.kind === "component") {
      const relatedExampleNames = snapshot.exampleNamesByComponent.get(item.name) ?? [];
      const exampleDetailsResults = await Promise.allSettled(
        relatedExampleNames.map((exampleName) => fetchExampleDetails(exampleName)),
      );

      detail.examples = exampleDetailsResults.flatMap((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Error fetching example ${relatedExampleNames[index]} for registry item ${item.name}:`,
            result.reason,
          );
          warnings.push(
            `Failed to fetch example ${relatedExampleNames[index]}: ${getErrorMessage(result.reason)}`,
          );
          return [];
        }

        const content = this.buildFilesSource(result.value.files);

        if (!content) {
          return [];
        }

        return [
          {
            name: result.value.name,
            title: result.value.title ?? formatDisplayName(result.value.name),
            description: result.value.description,
            content,
          },
        ];
      });
    }

    if (warnings.length > 0) {
      detail.warnings = warnings;
    }

    return detail;
  }

  private buildExampleComponentMap(
    examples: RegistryExample[],
  ): Map<string, string[]> {
    const exampleMap = new Map<string, string[]>();

    for (const example of examples) {
      for (const registryDependency of example.registryDependencies) {
        const componentName =
          this.parseRegistryDependencyName(registryDependency);

        if (!componentName) {
          continue;
        }

        if (!exampleMap.has(componentName)) {
          exampleMap.set(componentName, []);
        }

        const exampleNames = exampleMap.get(componentName);
        if (exampleNames && !exampleNames.includes(example.name)) {
          exampleNames.push(example.name);
        }
      }
    }

    return exampleMap;
  }

  private buildCatalog(snapshot: RegistrySnapshot): RegistryCatalogItem[] {
    return snapshot.entries.map((entry) => ({
      name: entry.name,
      title: entry.title ?? formatDisplayName(entry.name),
      description: entry.description,
      kind: this.normalizeKind(entry.type),
      registryType: entry.type,
    }));
  }

  private getAvailableKinds(catalog: RegistryCatalogItem[]): string[] {
    return [...new Set(catalog.map((item) => item.kind))].sort();
  }

  private normalizeKind(registryType: string): string {
    switch (registryType) {
      case "registry:ui":
        return "component";
      case "registry:example":
        return "example";
      case "registry:style":
        return "style";
      default:
        return registryType.replace(/^registry:/, "");
    }
  }

  private normalizeOffset(offset?: number): number {
    if (offset === undefined || Number.isNaN(offset)) {
      return 0;
    }

    return Math.max(Math.trunc(offset), 0);
  }

  private paginateItems<T>({
    items,
    options,
  }: PaginateItemsParams<T>): PaginateItemsResult<T> {
    const offset = this.normalizeOffset(options?.offset);
    const limit = options?.limit ?? items.length;
    const paginatedItems = items.slice(offset, offset + limit);
    const nextOffset = offset + paginatedItems.length;
    const hasMore = nextOffset < items.length;

    const result: PaginateItemsResult<T> = {
      limit,
      offset,
      hasMore,
      nextOffset: hasMore ? nextOffset : undefined,
      items: paginatedItems,
    };

    return result;
  }

  private getEntryDependencies(entries: RegistryEntry[], name: string): string[] {
    return entries.find((entry) => entry.name === name)?.dependencies ?? [];
  }

  private getEntryRegistryDependencies(
    entries: RegistryEntry[],
    name: string,
  ): string[] {
    return entries.find((entry) => entry.name === name)?.registryDependencies ?? [];
  }

  private getRelatedItems(
    item: RegistryCatalogItem,
    catalog: RegistryCatalogItem[],
    snapshot: RegistrySnapshot,
  ): RegistryCatalogItem[] {
    const catalogByName = new Map(catalog.map((entry) => [entry.name, entry]));
    const relatedNames =
      item.kind === "component"
        ? snapshot.exampleNamesByComponent.get(item.name) ?? []
        : this.extractRegistryDependencyNames(
          this.getEntryRegistryDependencies(snapshot.entries, item.name),
        );

    return relatedNames.flatMap((relatedName) => {
      const relatedItem = catalogByName.get(relatedName);
      return relatedItem ? [relatedItem] : [];
    });
  }

  private extractRegistryDependencyNames(
    registryDependencies: string[],
  ): string[] {
    return registryDependencies.flatMap((dependency) => {
      const dependencyName = this.parseRegistryDependencyName(dependency);

      return dependencyName ? [dependencyName] : [];
    });
  }

  private parseRegistryDependencyName(dependency: string): string | undefined {
    const normalizedDependency = dependency.trim();

    if (!normalizedDependency) {
      return undefined;
    }

    if (normalizedDependency.startsWith("@magicui/")) {
      return normalizedDependency.slice("@magicui/".length) || undefined;
    }

    const componentNameMatch = normalizedDependency.match(
      /(?:^|\/)r\/([^/.]+)(?:\.json)?$/,
    );
    if (componentNameMatch?.[1]) {
      return componentNameMatch[1];
    }

    if (
      !normalizedDependency.includes("/") &&
      !normalizedDependency.includes(":")
    ) {
      return normalizedDependency.replace(/\.json$/, "") || undefined;
    }

    return undefined;
  }

  private async fetchRegistryItemDetails(
    name: string,
  ): Promise<RegistryItemDetail> {
    return fetchRegistryItemDetails(name);
  }

  private buildRegistryItemSource(
    item: RegistryCatalogItem,
    itemDetails: RegistryItemDetail,
  ): string | undefined {
    const source = this.buildFilesSource(itemDetails.files);

    if (!source) {
      return undefined;
    }

    if (item.kind === "component") {
      return this.buildComponentContext(item.name, source);
    }

    return source;
  }

  private buildFilesSource(files: BuildFilesSourceOptions): string | undefined {
    const source = files
      .map((file) => {
        const trimmedContent = file.content.trim();

        if (!trimmedContent) {
          return undefined;
        }

        if (!file.path) {
          return trimmedContent;
        }

        return `// File: ${file.path}\n${trimmedContent}`;
      })
      .filter((value): value is string => Boolean(value))
      .join("\n\n");

    return source || undefined;
  }

  private buildRegistryInstallCommand(name: string): string {
    return `npx shadcn@latest add "${buildRegistryItemUrl(name)}"`;
  }

  private buildComponentContext(
    componentName: string,
    componentContent: string,
  ): string {
    return `The code below is for context only. It helps you understand the component's props, types, and behavior. To actually install and use the component, refer to the install instructions above. After installing, the component is typically available for import from "@/components/ui/${componentName}", depending on the project's components.json.\n\n${componentContent}`;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const registryService = new RegistryService();
