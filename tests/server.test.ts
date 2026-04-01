import { describe, it, expect } from 'vitest';
import { Planner } from '../src/core/planner.js';
import { ProjectProfile } from '../src/types/index.js';

describe('ScaffoldForge Planner', () => {
  const planner = new Planner();
  const mockProfile: ProjectProfile = {
    type: 'react',
    language: 'typescript',
    packageManager: 'pnpm',
    rootDir: '.'
  };

  it('should generate a React feature plan', async () => {
    const plan = await planner.createPlan('generate_feature', mockProfile, {
      featureName: 'auth',
      targetStack: 'react'
    });

    expect(plan.operations.length).toBeGreaterThan(0);
  });
});
