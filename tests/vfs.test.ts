import { describe, it, expect } from 'vitest';
import { FileSystemService } from '../src/filesystem/vfs.js';

describe('FileSystemService (VFS)', () => {
  it('should collect operations in dry-run mode', async () => {
    const vfs = new FileSystemService(true);
    await vfs.writeFile('test.txt', 'hello', 'unit test');
    
    const ops = vfs.getOperations();
    expect(ops).toHaveLength(1);
    expect(ops[0].path).toBe('test.txt');
  });
});
