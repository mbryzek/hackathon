// dry-copy: sveltekit/reap-leaked-children
import { execFileSync } from 'node:child_process';
import { isMainThread } from 'node:worker_threads';

/**
 * KILL WHAT THIS PROCESS STILL OWNS WHEN IT EXITS.
 *
 * `@sveltejs/adapter-cloudflare`'s `emulate()` calls wrangler's `getPlatformProxy()`, which
 * starts a miniflare `workerd`, and the adapter disposes it nowhere. SvelteKit calls
 * `emulate()` from its prerender pass, and that pass runs in a worker THREAD rather than a
 * subprocess — so the `workerd` is a child of THIS pid, it outlives the build, and it is
 * reparented to init still holding two loopback-specific ephemeral ports. Every `vite build`
 * of a prerendering app leaks exactly one.
 *
 * A held loopback port is not inert. A wildcard bind does not reserve a port: the kernel's
 * wildcard allocator hands out `0.0.0.0:N` while the squatter keeps `127.0.0.1:N`, both binds
 * coexist, and a connection to `127.0.0.1:N` goes to the MOST SPECIFIC listener — the
 * squatter. That is how a frontend build makes an unrelated repo's forked test runner hang on
 * a handshake nothing will ever answer.
 *
 * This matches on nothing — not a process name, not an age, not a port. A direct child still
 * alive once `exit` has been reached is provably ours (it is a child of this pid) and provably
 * finished with (this process is going away), which is true of any daemon a build leaves
 * behind and not only of `workerd`.
 *
 * This region is copied verbatim into every SvelteKit repo in this account that builds on
 * `adapter-cloudflare`. The `dry-copy` markers are the declaration — `dev repo copies`
 * enumerates every copy carrying them and reports one that has drifted, so a change here
 * that does not reach the others is caught rather than merely regretted (ISS-3894).
 *
 * Delete this once every repo carrying this block is on `@sveltejs/adapter-cloudflare`
 * v8+. v8 drops `emulate()`: the platform proxy moves into a Vite plugin that runs only
 * for dev and preview servers, so a build never creates one. The adapter still disposes
 * the proxy nowhere, so the version is the trigger to watch for — not a `dispose()` call,
 * which is not coming. The check is that `emulate` no longer appears in
 * `node_modules/@sveltejs/adapter-cloudflare/index.js`. ISS-5600
 */
if (isMainThread) {
  // Absolute path so nothing earlier on PATH can change what runs, and `-P` so the only thing
  // this can ever name is a child of this pid. Never a pattern: on a machine running several
  // builds at once a pattern matches the other builds too. `pgrep` exits 1 when there are no
  // children and is absent on some platforms; neither is worth a word on a build that has
  // otherwise succeeded.
  const ownChildren = () => {
    try {
      return execFileSync('/usr/bin/pgrep', ['-P', String(process.pid)], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      })
        .split('\n')
        .map((line) => Number(line.trim()))
        .filter((pid) => pid > 0);
    } catch {
      return [];
    }
  };

  let reaped = false;
  process.on('exit', () => {
    if (reaped) return;
    reaped = true;

    let killed = 0;
    for (const pid of ownChildren()) {
      try {
        process.kill(pid, 'SIGTERM');
        killed++;
      } catch {
        // Already gone between the listing and the signal.
      }
    }

    // Say so rather than reaping in silence: this line is how anyone learns the leak is still
    // there, and its absence is how they learn it is not.
    if (killed > 0) {
      try {
        console.error(`svelte.config.js: reaped ${killed} leftover child process(es) — ISS-5600`);
      } catch {
        // stderr already closed
      }
    }
  });
}
// dry-copy-end

import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>']
      }
    }),
    alias: {
      $generated: 'src/generated'
    }
  }
};

export default config;
