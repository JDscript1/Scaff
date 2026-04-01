import path from 'node:path';
import fs from 'node:fs/promises';
import { ProjectProfile } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ProjectDetector {
  /**
   * Căutare recursivă în sus pentru a găsi rădăcina proiectului
   */
  private static async findRoot(startPath: string, markers: string[]): Promise<string | null> {
    let current = path.resolve(startPath);
    const rootDir = path.parse(current).root;

    while (current !== rootDir) {
      try {
        const files = await fs.readdir(current);
        if (markers.some(m => files.includes(m))) {
          return current;
        }
      } catch (e) {
        break;
      }
      current = path.dirname(current);
    }
    return null;
  }

  static async detect(targetPath: string): Promise<ProjectProfile> {
    const absolutePath = path.resolve(targetPath);
    
    // Căutăm rădăcina proiectului (marker: package.json sau build.gradle)
    const projectRoot = await this.findRoot(absolutePath, ['package.json', 'build.gradle', 'build.gradle.kts']) || absolutePath;

    const profile: ProjectProfile = {
      type: 'unknown',
      language: 'typescript',
      packageManager: 'npm',
      rootDir: projectRoot
    };

    try {
      const files = await fs.readdir(projectRoot);

      if (files.includes('package.json')) {
        const pkgContent = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
        
        if (pkgContent.dependencies?.['react'] || pkgContent.devDependencies?.['vite']) {
          profile.type = 'react';
        } else if (pkgContent.dependencies?.['fastify']) {
          profile.type = 'fastify';
        }

        if (files.includes('pnpm-lock.yaml')) profile.packageManager = 'pnpm';
        else if (files.includes('yarn.lock')) profile.packageManager = 'yarn';
      } else if (files.includes('build.gradle') || files.includes('build.gradle.kts')) {
        profile.type = 'android';
        profile.packageManager = 'gradle';
        profile.language = 'kotlin';
      }

      logger.info(`Detectat proiect tip: ${profile.type} în ${projectRoot}`);
    } catch (error) {
      logger.warn(`Eroare la detecție în ${projectRoot}. Se folosesc valori default.`);
    }

    return profile;
  }
}
