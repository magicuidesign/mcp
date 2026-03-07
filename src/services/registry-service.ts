import type {
  RegistryCatalogItem,
  RegistryCatalogItemDetail,
  RegistryEntry,
  RegistryComponent,
  RegistryEnrichedComponent,
  RegistryExample,
  RegistryItemDetail,
  RegistrySnapshot,
} from "../domain/registry.js";
import {
  type ComponentCategoryName,
  componentCategories,
  getCategoriesForComponent,
} from "../registry/categories.js";
import {
  fetchComponentDetails,
  fetchExampleDetails,
  fetchRegistryEntries,
  fetchRegistryItemDetails,
  parseExampleComponents,
  parseUIComponents,
} from "../registry/client.js";
import { IndividualComponentSchema } from "../registry/schemas.js";
import { formatComponentName, formatDisplayName } from "../utils/formatters.js";

const DEFAULT_RESULT_LIMIT = 25;
const MAX_RESULT_LIMIT = 100;

export class RegistryService {
  private snapshot?: RegistrySnapshot;
  private snapshotPromise?: Promise<RegistrySnapshot>;

  async listUIComponents(): Promise<RegistryComponent[]> {
    return parseUIComponents(await fetchRegistryEntries());
  }

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
      const components = parseUIComponents(entries);
      const examples = parseExampleComponents(entries);

      const snapshot = {
        entries,
        components,
        examples,
        exampleNamesByComponent: this.buildExampleComponentMap(examples),
      };

      this.snapshot = snapshot;
      return snapshot;
    } finally {
      this.snapshotPromise = undefined;
    }
  }

  async getCategoryComponents(
    category: ComponentCategoryName,
    snapshot?: RegistrySnapshot,
  ): Promise<RegistryEnrichedComponent[]> {
    const activeSnapshot = snapshot ?? (await this.createSnapshot());

    return this.fetchComponentsByNames(
      componentCategories[category],
      activeSnapshot,
    );
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
      const itemDetails = await this.fetchRegistryItemDetails(name);
      const source = itemDetails.files[0]?.content;

      if (source) {
        detail.source =
          item.kind === "component"
            ? this.buildComponentContext(item.name, source)
            : source;
      }
    }

    if (options?.includeExamples && item.kind === "component") {
      const relatedExampleNames = snapshot.exampleNamesByComponent.get(name) ?? [];
      const exampleDetailsList = await Promise.all(
        relatedExampleNames.map((exampleName) => fetchExampleDetails(exampleName)),
      );

      detail.examples = exampleDetailsList.flatMap((exampleDetails) => {
        const content = exampleDetails.files[0]?.content;

        if (!content) {
          return [];
        }

        return [
          {
            name: exampleDetails.name,
            title: formatDisplayName(exampleDetails.name),
            description: exampleDetails.description,
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

  private async fetchComponentsByNames(
    componentNames: readonly string[],
    snapshot: RegistrySnapshot,
  ): Promise<RegistryEnrichedComponent[]> {
    const componentResults: RegistryEnrichedComponent[] = [];
    const componentsByName = new Map(
      snapshot.components.map((component) => [component.name, component]),
    );

    for (const componentName of componentNames) {
      const component = componentsByName.get(componentName);

      if (!component) {
        continue;
      }

      try {
        const componentDetails = await fetchComponentDetails(componentName);
        const componentContent = componentDetails.files[0]?.content;

        if (!componentContent) {
          throw new Error(`Component ${componentName} is missing source content`);
        }

        const relevantExampleNames =
          snapshot.exampleNamesByComponent.get(componentName) ?? [];

        const exampleDetailsList = await Promise.all(
          relevantExampleNames.map((name) => fetchExampleDetails(name)),
        );

        const formattedExamples = exampleDetailsList.flatMap((details) => {
          const exampleContent = details.files[0]?.content;

          if (!exampleContent) {
            return [];
          }

          return [
            {
              name: details.name,
              type: details.type,
              description: details.description,
              content: exampleContent,
            },
          ];
        });

        const validatedComponent = IndividualComponentSchema.parse({
          name: component.name,
          type: component.type,
          description: component.description,
          install: this.buildInstallInstructions(component.name),
          content: this.buildComponentContext(component.name, componentContent),
          examples: formattedExamples,
        });

        componentResults.push(validatedComponent);
      } catch (error) {
        console.error(`Error processing component ${componentName}:`, error);
      }
    }

    return componentResults;
  }

  private buildCatalog(snapshot: RegistrySnapshot): RegistryCatalogItem[] {
    return snapshot.entries.map((entry) => ({
      name: entry.name,
      title: entry.title ?? formatDisplayName(entry.name),
      description: entry.description,
      kind: this.normalizeKind(entry.type),
      registryType: entry.type,
      categories:
        entry.type === "registry:ui" ? getCategoriesForComponent(entry.name) : [],
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

        const searchableFields = [
          item.name,
          item.title,
          item.description ?? "",
          item.kind,
          item.registryType,
          ...item.categories,
        ];

        return searchableFields.some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private getSearchScore(item: RegistryCatalogItem, query: string): number {
    const normalizedQuery = query.toLowerCase();

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

    if (
      item.categories.some(
        (category) => category.toLowerCase() === normalizedQuery,
      )
    ) {
      score += 40;
    } else if (
      item.categories.some((category) =>
        category.toLowerCase().includes(normalizedQuery),
      )
    ) {
      score += 20;
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

  private buildInstallInstructions(componentName: string): string {
    return `Install the component using the same process as shadcn/ui. If you run into linter or dependency errors, make sure to install the component using these instructions. For example, with npm/npx: npx shadcn@latest add "https://magicui.design/r/${componentName}.json" (Rules: make sure the URL is wrapped in double quotes and use shadcn not shadcn-ui, or the command will fail). After installation, you can import the component like this: import { ${formatComponentName(componentName)} } from "@/components/ui/${componentName}";`;
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
