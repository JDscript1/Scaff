import Handlebars from 'handlebars';
import { logger } from '../utils/logger.js';

export class TemplateEngine {
  constructor() {
    this.registerHelpers();
  }

  private registerHelpers() {
    Handlebars.registerHelper('pascalCase', (str: string) => {
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/\s+|[-_]/g, '');
    });

    Handlebars.registerHelper('kebabCase', (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    });
  }

  compile(templateContent: string, data: any): string {
    try {
      const template = Handlebars.compile(templateContent);
      return template(data);
    } catch (error: any) {
      logger.error('Eroare la compilarea template-ului:', error);
      throw new Error(`Template compilation failed: ${error.message}`);
    }
  }
}
