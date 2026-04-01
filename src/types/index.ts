export interface FileOperation {
  type: 'create' | 'modify' | 'delete';
  path: string;
  content: string;
  description: string;
  overwrite?: boolean;
}

export interface GenerationResult {
  success: boolean;
  summary: string;
  filesCreated: string[];
  filesModified: string[];
  warnings: string[];
  nextSteps?: string[];
}

export type ProjectProfile = {
  type: 'react' | 'fastify' | 'android' | 'unknown';
  language: 'typescript' | 'kotlin' | 'javascript';
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'gradle';
  rootDir: string;
};
