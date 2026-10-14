/**
 * The standalone deploy stays standalone.
 *
 * scripts/deploy and the workflow that runs it exist so that anyone holding a Cloudflare API token
 * can deploy this site from a fresh clone (README.md, "Deploying"). That holds only while neither of
 * them reaches for tooling outside this repository, and nothing else would notice the day one did:
 * the person it breaks for is a volunteer without that tooling, not whoever made the change.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8');

/** The lines a shell or a workflow runner executes, with comments dropped. */
const code = (text: string) =>
  text
    .split('\n')
    .map((line) => line.replace(/(^|\s)#.*$/, ''))
    .filter((line) => line.trim() !== '');

const script = read('scripts/deploy');
const workflow = read('.github/workflows/deploy.yml');

describe.each([
  ['scripts/deploy', script],
  ['.github/workflows/deploy.yml', workflow]
])('%s', (_name, text) => {
  it('calls no `dev` command', () => {
    expect(code(text).filter((line) => /(^|[\s;&|(])dev\s/.test(line))).toEqual([]);
  });

  it('reads nothing outside the repository', () => {
    expect(code(text).filter((line) => /~\/|\$HOME|\/code\//.test(line))).toEqual([]);
  });
});

describe('scripts/deploy', () => {
  it('deploys with the wrangler pinned in package-lock.json', () => {
    expect(code(script).some((line) => line.includes('./node_modules/.bin/wrangler'))).toBe(true);
  });

  it('refuses without both Cloudflare values', () => {
    expect(script).toContain('${CLOUDFLARE_API_TOKEN:-}');
    expect(script).toContain('${CLOUDFLARE_ACCOUNT_ID:-}');
  });
});

describe('.github/workflows/deploy.yml', () => {
  it('runs scripts/deploy with both secrets', () => {
    expect(workflow).toContain('run: scripts/deploy');
    expect(workflow).toContain('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}');
    expect(workflow).toContain('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}');
  });

  it('deploys on a push to main', () => {
    expect(workflow).toMatch(/push:\s*\n\s*branches: \[main\]/);
  });
});
