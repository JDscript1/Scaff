import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TemplateEngine } from '../core/template-engine.js';
import { FileOperation, ProjectProfile } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { safeResolve } from '../filesystem/path-utils.js';

export abstract class BaseGenerator {
  protected templateEngine: TemplateEngine;
  private readonly templatesDir: string;

  constructor() {
    this.templateEngine = new TemplateEngine();
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // In build runtime, templates may still live in src/templates.
    const builtTemplatesDir = path.resolve(__dirname, '..', 'templates');
    const sourceTemplatesDir = path.resolve(__dirname, '..', '..', 'src', 'templates');
    this.templatesDir = existsSync(builtTemplatesDir) ? builtTemplatesDir : sourceTemplatesDir;
  }

  /**
   * Citește un template de pe disc folosind un guard de securitate.
   */
  protected async getTemplate(templatePath: string): Promise<string> {
    // SECURITY: Prevenim path traversal în interiorul folderului de templates
    const securePath = safeResolve(this.templatesDir, templatePath);
    
    try {
      return await fs.readFile(securePath, 'utf8');
    } catch (error: any) {
      logger.error(`Eroare critică la încărcarea template-ului: ${templatePath}`);
      throw new Error(`Template not found or access denied: ${templatePath}`);
    }
  }

  abstract generateInit(data: any): Promise<FileOperation[]>;
  abstract generateFeature(profile: ProjectProfile, data: any): Promise<FileOperation[]>;
}
