/// <reference types="vitest/config" />
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

/** Set by vitest in the process that loads this config. */
const IS_TEST_RUN = process.env['VITEST'] !== undefined;

export default defineConfig({
  // Tailwind 4 through its own vite plugin rather than through postcss: it compiles with
  // Lightning CSS, which also does the vendor prefixing autoprefixer used to, so this repo has no
  // postcss.config.js and no autoprefixer. First in the list, as the plugin's own docs require.
  plugins: [
    tailwindcss(),
    // SvelteKit takes its whole configuration here. `#lib` and `#generated` are subpath
    // imports declared in package.json, not aliases declared here.
    sveltekit({
      preprocess: vitePreprocess(),
      // No `routes` option: it only ever generated `_routes.json`, which is how a Cloudflare
      // PAGES project decides which requests reach its Function. This app deploys as a Worker
      // with static assets (`main` + `[assets]` in wrangler.toml), where the asset server
      // answers what it has and the Worker gets the rest — so the adapter reads the option
      // nowhere and passing one would read as routing configuration that does nothing.
      //
      // Not under vitest. The adapter's own Vite plugin starts wrangler's platform proxy — a
      // `workerd` process — for every Vite server, and a test run is one: no test reads
      // `event.platform`, and the proxy keeps the run from exiting until vitest gives up on it.
      ...(IS_TEST_RUN ? {} : { adapter: adapter() })
    })
  ],
  resolve: {
    alias: {
      url: path.resolve(__dirname, 'src/lib/url-shim.ts')
    },
    // Under vitest, resolve Svelte to its client build so component tests can `mount()` a component
    // into jsdom. Without this the server build is loaded and mount() throws
    // `lifecycle_function_unavailable`. Guarded by VITEST so the app's own build is untouched.
    ...(IS_TEST_RUN ? { conditions: ['browser'] } : {})
  },
  test: {
    // The visual parity harness's own units (`playwright/visual/*.test.ts`) run here too: they
    // pin the bookkeeping a capture cannot assert about itself -- the shot key, the page-set
    // derivation, the manifest compare. See playwright/visual/README.md.
    // `playwright/*.test.ts` is the suite's own top-level harness on the same terms: the readiness
    // probe global setup classifies a server with, which no spec can assert because a spec runs only
    // once it has passed.
    include: ['src/**/*.test.ts', 'playwright/*.test.ts', 'playwright/visual/**/*.test.ts'],
    // NODE'S OWN `localStorage` HIDES JSDOM'S. From Node 25 Web Storage is on by default, and
    // without `--localstorage-file` the global it installs reads `undefined` — and vitest's jsdom
    // environment leaves a global Node already defines alone, so a jsdom test reaching for
    // `localStorage` gets Node's nothing instead of jsdom's store. `engines` admits Node 26, so a
    // runner on it fails every such test while one on 24 passes them. Turning the Node feature off
    // in the test workers leaves jsdom's the only `localStorage` there is; the flag is accepted by
    // every Node line `engines` names. ISS-11542
    execArgv: ['--no-experimental-webstorage']
  }
});
