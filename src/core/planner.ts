import { FileOperation, ProjectProfile } from '../types/index.js';
import { ReactGenerator } from '../generators/react-generator.js';
import { FastifyGenerator } from '../generators/fastify-generator.js';
import { AndroidGenerator } from '../generators/android-generator.js';
import { CapabilityGenerator } from '../generators/capability-generator.js';
import { BaseGenerator } from '../generators/base-generator.js';
import { 
  InitProjectArgs, 
  GenerateFeatureArgs, 
  GenerateComponentArgs, 
  GenerateBackendModuleArgs,
  AddCapabilityArgs 
} from '../types/schemas.js';
import path from 'node:path';

export interface GenerationPlan {
  operations: FileOperation[];
  warnings: string[];
  overwrite?: boolean;
}

type ToolArgs = InitProjectArgs | GenerateFeatureArgs | GenerateComponentArgs | GenerateBackendModuleArgs | AddCapabilityArgs;

export class Planner {
  private generators: Record<string, BaseGenerator>;
  private capGenerator: CapabilityGenerator;

  constructor() {
    this.generators = {
      'react': new ReactGenerator(),
      'fastify': new FastifyGenerator(),
      'android': new AndroidGenerator()
    };
    this.capGenerator = new CapabilityGenerator();
  }

  private getOverwriteFlag(data: ToolArgs): boolean {
    if ('options' in data && data.options) {
      return (data.options as any).overwrite || false;
    }
    return false;
  }

  async createPlan(
    requestType: string,
    profile: ProjectProfile,
    data: ToolArgs
  ): Promise<GenerationPlan> {
    const overwrite = this.getOverwriteFlag(data);
    const plan: GenerationPlan = { operations: [], warnings: [], overwrite };
    
    if (requestType === 'add_project_capability') {
      const args = data as AddCapabilityArgs;
      plan.operations = await this.capGenerator.addCapability(args.capabilityName, profile, overwrite);
      return plan;
    }

    if (requestType === 'generate_backend_module') {
      const args = data as GenerateBackendModuleArgs;
      const generator = this.generators[args.framework] as FastifyGenerator;
      
      if (generator) {
        const baseDir = args.targetPath || `src/modules/${args.moduleName}`;
        
        if (args.includeRoutes) {
          const ops = await generator.generateFeature(profile, { featureName: args.moduleName, targetPath: baseDir });
          plan.operations.push(...ops.map(o => ({ ...o, overwrite })));
        }

        if (args.includeService) {
          const serviceTpl = await (generator as any).getTemplate('fastify/service.hbs');
          plan.operations.push({
            type: 'create',
            path: path.join(baseDir, `${args.moduleName}.service.ts`),
            content: (generator as any).templateEngine.compile(serviceTpl, { name: args.moduleName }),
            description: `Serviciu backend: ${args.moduleName}`,
            overwrite
          });
        }
      }
      return plan;
    }

    const stack = this.resolveStack(requestType, data, profile);
    const generator = this.generators[stack];

    if (!generator) {
      throw new Error(`Stack-ul "${stack}" nu este suportat încă.`);
    }

    const mapOps = (ops: FileOperation[]) => ops.map(op => ({ ...op, overwrite }));

    if (requestType === 'init_project') {
      plan.operations = mapOps(await generator.generateInit(data as InitProjectArgs));
    } else {
      plan.operations = mapOps(await generator.generateFeature(profile, data));
    }

    return plan;
  }

  private resolveStack(type: string, data: ToolArgs, profile: ProjectProfile): string {
    if (type === 'init_project') return (data as InitProjectArgs).projectType.split('-')[0];
    if (type === 'generate_feature') return (data as GenerateFeatureArgs).targetStack;
    if (type === 'generate_component') return (data as GenerateComponentArgs).framework;
    return profile.type;
  }
}
