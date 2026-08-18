// dry-copy: sveltekit/node-version-test — every copy of this region must match; `dev repo copies` checks it (ISS-3894)
/**
 * What Node version this repo runs on, said once and kept true (ISS-2442).
 *
 * package.json `engines.node` is the one declaration, and `.npmrc`'s `engine-strict=true` is what
 * makes it a gate: npm refuses to install for anyone outside it and names THIS package rather than
 * a transitive one. These tests are the other half — they keep the declaration honest, because it
 * is a hand-written range describing a dependency tree that moves under it on every bump. Without
 * them the real floor is whatever the tree happens to demand, discoverable only from an install
 * failure naming a package the repo never mentions.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { subset, validRange } from 'semver';
import { describe, expect, it } from 'vitest';

const root = new URL('../', import.meta.url);
const resolve = (name: string) => fileURLToPath(new URL(name, root));
const read = (name: string) => readFileSync(resolve(name), 'utf8');

const declared: string = JSON.parse(read('package.json')).engines?.node;

// A hint to a version manager, not a second declaration — a repo carries `.nvmrc` only where
// something reads it. Where there is none there is nothing to drift, so the check below skips
// rather than inventing a pin, and it starts applying on its own the day a repo adds one.
const nvmrc = existsSync(resolve('.nvmrc')) ? read('.nvmrc').trim() : null;

interface LockPackage {
  engines?: { node?: string };
  // Platform binaries (esbuild, rolldown, sharp, fsevents). npm only applies the engines check to
  // packages it actually installs, so these constrain nothing on a machine they are not built for.
  os?: string[];
  cpu?: string[];
}

const lockPackages: Record<string, LockPackage> = JSON.parse(read('package-lock.json')).packages;

describe('declared Node version', () => {
  it('is a real semver range', () => {
    expect(validRange(declared)).not.toBeNull();
  });

  it('covers no version the dependency tree rejects', () => {
    // The check that stops the declaration going stale. A dependency bump can raise the real floor
    // silently, and `engine-strict` would then surface that as an EBADENGINE about a package nobody
    // chose. Subset, not "does our floor satisfy each range": a tree that supports 22.13+ and 24+
    // but not 23 makes a plain `>=22.13.0` admit a version it refuses to install on.
    const rejects = Object.entries(lockPackages)
      // '' is this package's own entry in the lockfile, not a dependency.
      .filter(([name, pkg]) => name !== '' && pkg.engines?.node && !pkg.os && !pkg.cpu)
      .filter(([, pkg]) => !subset(declared, pkg.engines!.node!))
      .map(([name, pkg]) => `${name} requires ${pkg.engines!.node!}`);

    expect(rejects).toEqual([]);
  });

  it.skipIf(nvmrc === null)('is what .nvmrc pins developers to', () => {
    // Deliberately NOT an assertion about one specific version: the fleet upgrades Node on its own
    // schedule, and pinning the build to one line would park every pull request in this repo the
    // day that happened. `nvmrc` is non-null here — `skipIf` above is the guard, which TypeScript
    // does not follow into the callback.
    expect(subset(nvmrc!, declared)).toBe(true);
  });
});
// dry-copy-end
