import { BaseGenerator } from './base-generator.js';
import { FileOperation, ProjectProfile } from '../types/index.js';
import path from 'node:path';

export class ReactGenerator extends BaseGenerator {
  async generateInit(data: any): Promise<FileOperation[]> {
    return [
      {
        type: 'create',
        path: 'src/App.tsx',
        content: 'export default function App() { return <h1>ScaffoldForge React App</h1>; }',
        description: 'Componentă principală React'
      }
    ];
  }

  async generateFeature(profile: ProjectProfile, data: any): Promise<FileOperation[]> {
    const featureName = data.featureName || data.componentName;
    const baseDir = data.targetPath || `src/features/${featureName}`;
    
    // Încărcare și compilare din fișiere externe
    const componentTpl = await this.getTemplate('react/component.hbs');
    const componentContent = this.templateEngine.compile(componentTpl, { name: featureName });

    return [
      {
        type: 'create',
        path: path.join(baseDir, `${featureName}.tsx`),
        content: componentContent,
        description: `Componentă React PascalCase: ${featureName}`
      },
      {
        type: 'create',
        path: path.join(baseDir, `index.ts`),
        content: `export * from './${featureName}';`,
        description: 'Barrel export'
      }
    ];
  }
}
