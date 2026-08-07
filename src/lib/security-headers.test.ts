import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SECURITY_HEADERS } from './security-headers';

/**
 * `_headers` covers what Cloudflare Pages serves directly (prerendered pages, static
 * assets); `SECURITY_HEADERS` covers what the SvelteKit worker renders. Neither covers
 * the other's surface, so a header added to one and not the other ships applied to half
 * the site with nothing to say so. This is the thing that says so.
 */
const HEADERS_FILE = new URL('../../_headers', import.meta.url);

interface HeadersRule {
  path: string;
  headers: Record<string, string>;
}

/**
 * Parses the Cloudflare `_headers` format: a rule is an unindented path pattern followed
 * by indented `Name: value` lines. Blank lines and `#` comments are ignored.
 */
function parseHeadersFile(contents: string): HeadersRule[] {
  const rules: HeadersRule[] = [];

  for (const line of contents.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) {
      continue;
    }

    if (!/^\s/.test(line)) {
      rules.push({ path: line.trim(), headers: {} });
      continue;
    }

    const rule = rules.at(-1);
    expect(rule, `header line before any path pattern: ${line}`).toBeDefined();

    const separator = line.indexOf(':');
    expect(separator, `not a "Name: value" header line: ${line}`).toBeGreaterThan(0);
    rule!.headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  return rules;
}

describe('_headers', () => {
  const rules = parseHeadersFile(readFileSync(HEADERS_FILE, 'utf8'));

  it('applies one rule, to every path', () => {
    expect(rules.map((rule) => rule.path)).toEqual(['/*']);
  });

  it('declares exactly the headers the worker sets, so the two surfaces agree', () => {
    expect(rules[0]?.headers).toEqual({ ...SECURITY_HEADERS });
  });
});
