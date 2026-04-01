import { BaseGenerator } from './base-generator.js';
import { FileOperation, ProjectProfile } from '../types/index.js';
import path from 'node:path';

export class FastifyGenerator extends BaseGenerator {
  async generateInit(data: any): Promise<FileOperation[]> {
    return [
      {
        type: 'create',
        path: 'src/index.ts',
        content: "import Fastify from 'fastify';\nconst fastify = Fastify();\nfastify.listen({ port: 3000 });",
        description: 'Server Fastify'
      }
    ];
  }

  async generateFeature(profile: ProjectProfile, data: any): Promise<FileOperation[]> {
    const { featureName } = data;
    const baseDir = data.targetPath || `src/modules/${featureName}`;

    const routeTpl = await this.getTemplate('fastify/route.hbs');
    const routeContent = this.templateEngine.compile(routeTpl, { name: featureName });

    return [
      {
        type: 'create',
        path: path.join(baseDir, `${featureName}.routes.ts`),
        content: routeContent,
        description: `Rute Fastify pentru modulul ${featureName}`
      }
    ];
  }
}
