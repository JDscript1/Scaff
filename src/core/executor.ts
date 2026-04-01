import { FileSystemService } from '../filesystem/vfs.js';
import { GenerationPlan } from './planner.js';
import { GenerationResult } from '../types/index.js';

export class Executor {
  constructor(private vfs: FileSystemService) {}

  async execute(plan: GenerationPlan): Promise<GenerationResult> {
    const filesCreated: string[] = [];
    const filesModified: string[] = [];

    for (const op of plan.operations) {
      if (op.type === 'create') {
        await this.vfs.writeFile(op.path, op.content, op.description);
        filesCreated.push(op.path);
      }
    }

    return {
      success: true,
      summary: `Generare finalizată: ${filesCreated.length} fișiere create.`,
      filesCreated,
      filesModified,
      warnings: plan.warnings
    };
  }
}
