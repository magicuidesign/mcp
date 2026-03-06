import type {
  RegistryComponent,
  RegistryEnrichedComponent,
  RegistryExample,
  RegistrySnapshot,
} from "../domain/registry.js";
import {
  type ComponentCategoryName,
  componentCategories,
} from "../registry/categories.js";
import {
  fetchComponentDetails,
  fetchExampleComponents,
  fetchExampleDetails,
  fetchUIComponents,
} from "../registry/client.js";
import { IndividualComponentSchema } from "../registry/schemas.js";
import { formatComponentName } from "../utils/formatters.js";

export class RegistryService {
  async listUIComponents(): Promise<RegistryComponent[]> {
    return fetchUIComponents();
  }

  async createSnapshot(): Promise<RegistrySnapshot> {
    const [components, examples] = await Promise.all([
      fetchUIComponents(),
      fetchExampleComponents(),
    ]);

    return {
      components,
      examples,
      exampleNamesByComponent: this.buildExampleComponentMap(examples),
    };
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

  private buildExampleComponentMap(
    examples: RegistryExample[],
  ): Map<string, string[]> {
    const exampleMap = new Map<string, string[]>();

    for (const example of examples) {
      for (const dependencyUrl of example.registryDependencies) {
        if (!dependencyUrl.includes("magicui.design")) {
          continue;
        }

        const componentNameMatch = dependencyUrl.match(/\/r\/([^/]+)$/);
        const componentName = componentNameMatch?.[1];

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

  private buildInstallInstructions(componentName: string): string {
    return `Install the component using the same process as shadcn/ui. If you run into linter or dependency errors, make sure to install the component using these instructions. For example, with npm/npx: npx shadcn@latest add "https://magicui.design/r/${componentName}.json" (Rules: make sure the URL is wrapped in double quotes and use shadcn not shadcn-ui, or the command will fail). After installation, you can import the component like this: import { ${formatComponentName(componentName)} } from "@/components/ui/${componentName}";`;
  }

  private buildComponentContext(
    componentName: string,
    componentContent: string,
  ): string {
    return `The code below is for context only. It helps you understand the component's props, types, and behavior. To actually install and use the component, refer to the install instructions above. After installing, the component will be available for import via: import { ${formatComponentName(componentName)} } from "@/components/ui/${componentName}";${componentContent}`;
  }
}

export const registryService = new RegistryService();
