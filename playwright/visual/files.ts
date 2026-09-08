/**
 * WHERE A CAPTURE PUTS THINGS, and the two filesystem reads that derive the page lists (ISS-9319).
 *
 * Split out from the spec so the layout is stated once: the compare tool and the capture have to
 * agree on it byte for byte, and a path built twice is a path that is eventually built twice
 * differently.
 */
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Manifest } from './manifest.ts';
import type { StyleDump } from './styles.ts';

/** Every path under `root` whose filename ends with `suffix`, sorted, repo-relative. */
export function listFiles(root: string, suffix: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith(suffix))
    .map((entry) => join(root, entry))
    .sort();
}

/** The paths inside one capture directory. */
export const paths = {
  manifest: (out: string): string => join(out, 'manifest.json'),
  meta: (out: string): string => join(out, 'meta.json'),
  shard: (out: string, slug: string): string => join(out, 'shards', `${slug}.json`),
  png: (out: string, key: string): string => join(out, 'png', `${key}.png`),
  styles: (out: string, key: string): string => join(out, 'styles', `${key}.json.gz`)
};

export function writeFile(file: string, contents: Buffer | string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

export function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * The style dump, gzipped.
 *
 * Gzip on top of the interning in `styles.ts` because the two compress different things: interning
 * removes the repetition BETWEEN elements, gzip removes it inside the one remaining copy of each
 * vector, where three hundred properties in a row read `rgba(0, 0, 0, 0)` and `none`.
 */
export function writeStyles(out: string, key: string, dump: StyleDump): void {
  writeFile(paths.styles(out, key), gzipSync(Buffer.from(JSON.stringify(dump)), { level: 6 }));
}

export function readStyles(out: string, key: string): StyleDump | null {
  const file = paths.styles(out, key);
  if (!existsSync(file)) return null;
  return JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')) as StyleDump;
}

export function readManifest(dir: string): Manifest {
  const file = paths.manifest(dir);
  if (!existsSync(file)) {
    throw new Error(`${file} does not exist -- ${dir} is not a finished capture directory`);
  }
  return JSON.parse(readFileSync(file, 'utf8')) as Manifest;
}
