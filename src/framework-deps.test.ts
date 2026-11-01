// dry-copy: sveltekit/framework-deps-test — every copy of this region must match devops templates/sveltekit/src/framework-deps.test.ts; `dev repo copies` checks it (ISS-35724)
/**
 * The copy of a SvelteKit dependency the deployed Worker runs is the ROOT one (ISS-34896).
 *
 * SvelteKit's server output imports its runtime dependencies (devalue, cookie, ...) as bare
 * specifiers, and wrangler bundles that output from `.svelte-kit/`, so each one resolves to the
 * project's top-level `node_modules/<dep>` and never to the copy npm nests under the framework.
 * A direct dependency of ours bumped past the framework's own range is therefore what production
 * runs: devalue 6 at the root under a kit built for devalue 5 failed every server-rendered page
 * with a 500 while the unit suites and the build passed. Holding every root copy
 * inside the range kit declares is what keeps the Worker on code kit expects. Svelte is not held
 * to this: its runtime is bundled from its own directory, so its imports resolve beside it.
 */
import { readFileSync } from 'node:fs';
import { satisfies } from 'semver';
import { describe, expect, it } from 'vitest';

interface LockPackage {
  version?: string;
  dependencies?: Record<string, string>;
}

const lockPackages: Record<string, LockPackage> = JSON.parse(
  readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8')
).packages;

describe('SvelteKit runtime dependencies', () => {
  it('every one resolves at the root inside the range kit declares', () => {
    const declared = lockPackages['node_modules/@sveltejs/kit']?.dependencies ?? {};
    expect(Object.keys(declared).length).toBeGreaterThan(0);

    const outside = Object.entries(declared)
      .map(([dep, range]) => ({ dep, range, root: lockPackages[`node_modules/${dep}`]?.version }))
      .filter(({ range, root }) => root === undefined || !satisfies(root, range))
      .map(({ dep, range, root }) => `${dep}: kit declares ${range}, the root resolves ${root ?? 'nothing'}`);

    expect(outside).toEqual([]);
  });
});
// dry-copy-end
