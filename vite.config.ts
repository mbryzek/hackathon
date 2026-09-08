/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Tailwind 4 through its own vite plugin rather than through postcss: it compiles with
  // Lightning CSS, which also does the vendor prefixing autoprefixer used to, so this repo has no
  // postcss.config.js and no autoprefixer. First in the list, as the plugin's own docs require.
  plugins: [tailwindcss(), sveltekit()],
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
