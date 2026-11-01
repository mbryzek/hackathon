// dry-copy: sveltekit/lint-script-test — every copy of this region must match devops templates/sveltekit/src/lint-script.test.ts; `dev repo copies` checks it (ISS-37016)
/**
 * `npm ci` followed by `npm run lint` or `npm run lint:fix` works in a fresh clone (ISS-37016).
 *
 * `eslint.config.js` type-checks through `tsconfig.json`, which extends `$app/tsconfig`, and only
 * `svelte-kit sync` generates that file. `.npmrc` sets `ignore-scripts=true`, so `npm ci` never runs
 * `prepare`, and eslint aborts out of heap or reports a parse error on every file until something
 * syncs. `ci/build.sh` reaches eslint through `npm run check`, which has already synced, so no build
 * sees a script that lost its sync.
 *
 * `eslint --fix` turns off typescript-eslint's single-run inference, so the config's blocks share one
 * watch program per tsconfig. A block with no `extraFileExtensions` that reaches a tsconfig first
 * builds that program without `.svelte`, and every `.svelte` file then fails to parse. `npm run lint`
 * runs without `--fix`, so no build sees this one either.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const scripts: Record<string, string> = JSON.parse(read('package.json')).scripts;

describe('the lint scripts in a fresh clone', () => {
  it.each(['lint', 'lint:fix'])('%s syncs before eslint starts', (name) => {
    expect(scripts[name]).toMatch(/^svelte-kit sync && eslint /);
  });
});

describe('the eslint config under --fix', () => {
  it('declares .svelte on every block that names a tsconfig', () => {
    // Read as text: importing the config from a test pulls it into svelte-check's program.
    const blocks = read('eslint.config.js')
      .split(/^\s*project:/m)
      .slice(1);

    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block.slice(0, block.indexOf('}'))).toContain("extraFileExtensions: ['.svelte']");
    }
  });
});
// dry-copy-end
