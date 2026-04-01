import { BaseGenerator } from './base-generator.js';
import { FileOperation, ProjectProfile } from '../types/index.js';

export class CapabilityGenerator extends BaseGenerator {
  async generateInit(): Promise<FileOperation[]> { return []; }
  async generateFeature(): Promise<FileOperation[]> { return []; }

  async addCapability(capabilityName: string, profile: ProjectProfile, overwrite = false): Promise<FileOperation[]> {
    const ops: FileOperation[] = [];

    switch (capabilityName) {
      case 'docker':
        ops.push({
          type: 'create',
          path: 'Dockerfile',
          content: `FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]`,
          description: 'Configurație Docker',
          overwrite
        });
        break;

      case 'ci-github':
        ops.push({
          type: 'create',
          path: '.github/workflows/main.yml',
          content: `name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm install\n      - run: npm test`,
          description: 'GitHub Actions Workflow',
          overwrite
        });
        break;
    }

    return ops;
  }
}
