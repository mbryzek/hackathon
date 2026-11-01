/**
 * static/sitemap.xml names every page of the site.
 *
 * It is a hand-kept file nothing else reads, so a new page or a new year goes missing from it
 * without any visible symptom. `/` stays out on purpose: it is a redirect, and a sitemap names
 * the pages a crawler should index.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pages = Object.keys(import.meta.glob('/src/routes/**/+page.svelte'))
  .map((file) => file.replace(/^\/src\/routes/, '').replace(/\/\+page\.svelte$/, ''))
  .filter((path) => path !== '');

const sitemap = readFileSync(fileURLToPath(new URL('../static/sitemap.xml', import.meta.url)), 'utf8');
const listed = [...sitemap.matchAll(/<loc>https:\/\/bthackathon\.com([^<]*)<\/loc>/g)].map((match) => match[1]);

describe('static/sitemap.xml', () => {
  it('lists every page and nothing else', () => {
    expect([...listed].sort()).toEqual([...pages].sort());
  });
});
