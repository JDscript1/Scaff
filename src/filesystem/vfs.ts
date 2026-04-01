import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../utils/logger.js';
import { FileOperation } from '../types/index.js';
import { safeResolve } from './path-utils.js';

export class FileSystemService {
  private operations: FileOperation[] = [];
  private readonly root: string;

  constructor(private isDryRun: boolean = false, rootPath: string = process.cwd()) {
    this.root = path.resolve(rootPath);
  }

  private resolve(filePath: string): string {
    return safeResolve(this.root, filePath);
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    const absolutePath = this.resolve(dirPath);
    
    if (this.isDryRun) {
      logger.debug(`[DryRun] Directorul ar fi asigurat: ${dirPath}`);
      return;
    }
    
    await fs.mkdir(absolutePath, { recursive: true });
  }

  async writeFile(filePath: string, content: string, description: string, overwrite = false): Promise<void> {
    const absolutePath = this.resolve(filePath);
    const exists = await this.fileExists(filePath);

    this.operations.push({
      type: 'create',
      path: filePath,
      content,
      description,
      overwrite
    });

    if (exists && !overwrite) {
      throw new Error(
        `FILE_EXISTS: Fișierul "${filePath}" există deja. Generarea a fost oprită.`
      );
    }

    if (this.isDryRun) {
      logger.info(`[DryRun] ${exists ? 'SUPRASCRIERE' : 'CREARE'} fișier: ${filePath}`);
      return;
    }

    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(absolutePath, content, 'utf8');
    
    logger.info(`${exists ? 'Suprascris' : 'Creat'} fișier: ${filePath}`);
  }

  async fileExists(filePath: string): Promise<boolean> {
    const absolutePath = this.resolve(filePath);
    try {
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  async readFile(filePath: string): Promise<string> {
    const absolutePath = this.resolve(filePath);
    return await fs.readFile(absolutePath, 'utf8');
  }

  getOperations(): FileOperation[] {
    return this.operations;
  }
}
