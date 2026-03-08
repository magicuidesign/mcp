import type {
  RegistryCatalogItem,
  RegistryCatalogItemDetail,
  RegistryEntry,
  RegistryExample,
  RegistryItemDetail,
  RegistrySnapshot,
} from "../domain/registry.js";
import {
  fetchExampleDetails,
  fetchRegistryEntries,
  fetchRegistryItemDetails,
  parseExampleComponents,
} from "../registry/client.js";
import { formatComponentName, formatDisplayName } from "../utils/formatters.js";

const DEFAULT_RESULT_LIMIT = 25;
const MAX_RESULT_LIMIT = 150;

export class RegistryService {
  private snapshot?: RegistrySnapshot;
  private snapshotPromise?: Promise<RegistrySnapshot>;

  async createSnapshot(): Promise<RegistrySnapshot> {
    if (this.snapshot) {
      return this.snapshot;
    }

    if (this.snapshotPromise) {
      return this.snapshotPromise;
    }

    this.snapshotPromise = this.loadSnapshot();

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
      return snapshot;
    } finally {
      this.snapshotPromise = undefined;
    }
  }

  async listRegistryItems(options?: {
    kind?: string;
    query?: string;
    limit?: number;
  }): Promise<{
    total: number;
    availableKinds: string[];
    items: RegistryCatalogItem[];
  }> {
    const snapshot = await this.createSnapshot();
    const catalog = this.buildCatalog(snapshot);
    const filteredCatalog = this.filterCatalog(catalog, options);
    const items = filteredCatalog.slice(0, this.normalizeLimit(options?.limit));

    return {
      total: filteredCatalog.length,
      availableKinds: this.getAvailableKinds(catalog),
      items,
    };
  }

  async searchRegistryItems(options: {
    query: string;
    kind?: string;
    limit?: number;
  }): Promise<{
    query: string;
    total: number;
    availableKinds: string[];
    items: RegistryCatalogItem[];
  }> {
    const snapshot = await this.createSnapshot();
    const catalog = this.buildCatalog(snapshot);
    const query = options.query.trim();
    const filteredCatalog = this.filterCatalog(catalog, {
      kind: options.kind,
    });

    const rankedItems = filteredCatalog
      .map((item) => ({
        item,
        score: this.getSearchScore(item, query),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.item.name.localeCompare(right.item.name);
      })
      .map((entry) => entry.item);
    const items = rankedItems.slice(0, this.normalizeLimit(options.limit));

    return {
      query,
      total: rankedItems.length,
      availableKinds: this.getAvailableKinds(catalog),
      items,
    };
  }

  async getRegistryItem(
    name: string,
    options?: {
      includeSource?: boolean;
      includeExamples?: boolean;
      includeRelated?: boolean;
    },
  ): Promise<RegistryCatalogItemDetail> {
    const snapshot = await this.createSnapshot();
    const catalog = this.buildCatalog(snapshot);
    const item = catalog.find((entry) => entry.name === name);

    if (!item) {
      throw new Error(`Registry item "${name}" was not found`);
    }

    const detail: RegistryCatalogItemDetail = {
      ...item,
      install: {
        command: this.buildRegistryInstallCommand(name),
        registryUrl: this.buildRegistryItemUrl(name),
      },
      dependencies: this.getEntryDependencies(snapshot.entries, name),
      registryDependencies: this.getEntryRegistryDependencies(snapshot.entries, name),
    };

    if (options?.includeRelated) {
      detail.relatedItems = this.getRelatedItems(item, catalog, snapshot);
    }

    if (options?.includeSource) {
      try {
        const itemDetails = await this.fetchRegistryItemDetails(name);
        const source = this.buildRegistryItemSource(item, itemDetails);

        if (source) {
          detail.source = source;
        }
      } catch (error) {
        console.error(`Error fetching source for registry item ${name}:`, error);
      }
    }

    if (options?.includeExamples && item.kind === "component") {
      const relatedExampleNames = snapshot.exampleNamesByComponent.get(name) ?? [];
      const exampleDetailsResults = await Promise.allSettled(
        relatedExampleNames.map((exampleName) => fetchExampleDetails(exampleName)),
      );

      detail.examples = exampleDetailsResults.flatMap((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Error fetching example ${relatedExampleNames[index]} for registry item ${name}:`,
            result.reason,
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

  private filterCatalog(
    catalog: RegistryCatalogItem[],
    options?: {
      kind?: string;
      query?: string;
    },
  ): RegistryCatalogItem[] {
    const normalizedKind = options?.kind?.trim().toLowerCase();
    const normalizedQuery = options?.query?.trim().toLowerCase();
    const queryTerms = this.tokenizeSearchWords(options?.query ?? "");

    return catalog
      .filter((item) => {
        if (!normalizedKind) {
          return true;
        }

        return (
          item.kind.toLowerCase() === normalizedKind ||
          item.registryType.toLowerCase() === normalizedKind
        );
      })
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        const searchTerms = this.buildSearchTerms(item);
        return (
          searchTerms.some((value) => value.includes(normalizedQuery)) ||
          (queryTerms.length > 0 &&
            queryTerms.every((queryTerm) =>
              searchTerms.some((term) => term.includes(queryTerm)),
            ))
        );
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private getSearchScore(item: RegistryCatalogItem, query: string): number {
    const normalizedQuery = query.toLowerCase();
    const searchTerms = this.buildSearchTerms(item);
    const queryTerms = this.tokenizeSearchWords(query);

    if (!normalizedQuery) {
      return 0;
    }

    let score = 0;

    if (item.name === normalizedQuery) {
      score += 120;
    } else if (item.name.includes(normalizedQuery)) {
      score += 90;
    }

    if (item.title.toLowerCase() === normalizedQuery) {
      score += 100;
    } else if (item.title.toLowerCase().includes(normalizedQuery)) {
      score += 70;
    }

    if (item.description?.toLowerCase().includes(normalizedQuery)) {
      score += 35;
    }

    if (item.kind.toLowerCase() === normalizedQuery) {
      score += 25;
    }

    if (item.registryType.toLowerCase() === normalizedQuery) {
      score += 25;
    }

    if (searchTerms.some((term) => term === normalizedQuery)) {
      score += 40;
    } else if (searchTerms.some((term) => term.includes(normalizedQuery))) {
      score += 20;
    }

    if (
      queryTerms.length > 1 &&
      queryTerms.every((queryTerm) =>
        searchTerms.some((term) => term.includes(queryTerm)),
      )
    ) {
      score += 15;
    }

    return score;
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

  private normalizeLimit(limit?: number): number {
    if (!limit || Number.isNaN(limit)) {
      return DEFAULT_RESULT_LIMIT;
    }

    return Math.min(Math.max(Math.trunc(limit), 1), MAX_RESULT_LIMIT);
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

  private buildSearchTerms(item: RegistryCatalogItem): string[] {
    const fields = [
      item.name,
      item.title,
      item.description ?? "",
      item.kind,
      item.registryType,
    ];

    return [...new Set(fields.flatMap((field) => this.tokenizeSearchValue(field)))];
  }

  private tokenizeSearchValue(value: string): string[] {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return [];
    }

    const rawTokens = normalizedValue
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const normalizedTokens = rawTokens.flatMap((token) => {
      const singularToken = this.toSingularToken(token);

      return singularToken && singularToken !== token
        ? [token, singularToken]
        : [token];
    });

    return [...new Set([normalizedValue, ...normalizedTokens])];
  }

  private tokenizeSearchWords(value: string): string[] {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return [];
    }

    return [
      ...new Set(
        normalizedValue
          .split(/[^a-z0-9]+/)
          .map((token) => token.trim())
          .filter(Boolean)
          .map((token) => this.toSingularToken(token) ?? token),
      ),
    ];
  }

  private toSingularToken(token: string): string | undefined {
    if (token.length <= 3 || token.endsWith("ss")) {
      return undefined;
    }

    if (token.endsWith("ies") && token.length > 4) {
      return `${token.slice(0, -3)}y`;
    }

    if (/(ches|shes|xes|zes|ses|oes)$/.test(token) && token.length > 4) {
      return token.slice(0, -2);
    }

    if (token.endsWith("s") && token.length > 3) {
      return token.slice(0, -1);
    }

    return undefined;
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

  private buildFilesSource(
    files: Array<{
      content: string;
      path?: string;
    }>,
  ): string | undefined {
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
    return `npx shadcn@latest add "${this.buildRegistryItemUrl(name)}"`;
  }

  private buildRegistryItemUrl(name: string): string {
    return `https://magicui.design/r/${name}.json`;
  }

  private buildComponentContext(
    componentName: string,
    componentContent: string,
  ): string {
    return `The code below is for context only. It helps you understand the component's props, types, and behavior. To actually install and use the component, refer to the install instructions above. After installing, the component will be available for import via: import { ${formatComponentName(componentName)} } from "@/components/ui/${componentName}";${componentContent}`;
  }
}

export const registryService = new RegistryService();
