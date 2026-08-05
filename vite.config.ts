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
    include: ['src/**/*.test.ts']
  }
});
