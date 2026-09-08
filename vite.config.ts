/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      url: path.resolve(__dirname, 'src/lib/url-shim.ts')
    },
    // Under vitest, resolve Svelte to its client build so component tests can `mount()` a component
    // into jsdom. Without this the server build is loaded and mount() throws
    // `lifecycle_function_unavailable`. Guarded by VITEST so the app's own build is untouched.
    ...(process.env['VITEST'] ? { conditions: ['browser'] } : {})
  },
  test: {
    // The visual parity harness's own units (`playwright/visual/*.test.ts`) run here too: they
    // pin the bookkeeping a capture cannot assert about itself -- the shot key, the page-set
    // derivation, the manifest compare. See playwright/visual/README.md.
    include: ['src/**/*.test.ts', 'playwright/visual/**/*.test.ts']
  }
});
