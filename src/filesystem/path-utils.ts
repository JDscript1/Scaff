import path from 'node:path';

/**
 * Rezolvă o cale țintă relativ la o rădăcină, garantând că rezultatul
 * se află în interiorul ierarhiei rădăcinii (prevenire Path Traversal).
 */
export function safeResolve(base: string, target: string): string {
  const absoluteBase = path.resolve(base);
  const absoluteTarget = path.resolve(absoluteBase, target);

  const relative = path.relative(absoluteBase, absoluteTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    if (relative !== '' && !relative.startsWith('.')) {
        throw new Error(
          `SECURITY ALERT: Attempted path traversal detected. Target path "${target}" is outside the permitted workspace root "${base}".`
        );
    }
  }

  return absoluteTarget;
}

/**
 * Normalizează căile pentru afișare consecventă în logs/plan
 */
export function normalizeRelativePath(base: string, absolutePath: string): string {
  return path.relative(base, absolutePath);
}
