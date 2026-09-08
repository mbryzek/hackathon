import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the VISUAL PARITY HARNESS (`playwright/visual/`, ISS-9319).
 *
 * A second config beside `playwright.config.ts`, because this is not a test suite. Nothing in
 * `playwright/visual` asserts anything, `ci/e2e.sh` runs `npm run test:e2e` and this directory is
 * not in that config's `testDir` (`./playwright/tests`), so a capture only ever happens because
 * somebody asked for one. That is the right default — a capture is meaningless on its own, since
 * the verdict is the comparison of two of them taken from two different checkouts.
 *
 * IT MANAGES NO SERVER, deliberately. The whole point of an A/B is that the two sides are served
 * by two different working trees, so the caller stands the server up and passes `VISUAL_BASE_URL`;
 * a `webServer` block here would tie a capture to whichever tree the config happened to be read
 * from. `playwright/visual/README.md` is the sequence.
 *
 * NO RETRIES, EVER. A retry re-renders and silently replaces the shot, which is the one thing that
 * must not happen in a harness whose entire claim is that a rendering is reproducible: a shot that
 * only matched on the second try is a shot that proves the opposite of what it is recorded as.
 *
 * ISS-9327 copied this from playbook-admin (ISS-9319). Everything under `playwright/visual` except
 * `matrix.ts`, `pages.ts`, `plan.ts` and their tests carries `dry-copy` markers, so `dev repo
 * copies` reports a change that reaches one repo and not the other.
 */
const VISUAL_BASE_URL = process.env['VISUAL_BASE_URL'] || 'http://localhost:5173';
const VISUAL_OUT = process.env['VISUAL_OUT'] || 'visual-out';

export default defineConfig({
  testDir: './playwright/visual',
  // `*.spec.ts` only, narrower than playwright's default `*.@(spec|test).ts`: `*.test.ts` beside
  // the harness are VITEST units, and collecting one here loads `@vitest/expect` into the
  // playwright worker, where it dies redefining playwright's own matcher symbol.
  testMatch: '**/*.spec.ts',
  globalSetup: './playwright/visual/setup.ts',
  globalTeardown: './playwright/visual/merge.ts',
  outputDir: `${VISUAL_OUT}/test-results`,
  // Per-test timeout is set inside the spec: one test is a whole page, which is one navigation
  // per viewport and a full-page screenshot per state.
  timeout: 300_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  workers: Number(process.env['VISUAL_WORKERS'] || 4),
  reporter: [['list']],
  use: {
    baseURL: VISUAL_BASE_URL,
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    /**
     * CHROMIUM'S OWN RASTERISER IS NOT DETERMINISTIC BY DEFAULT, and the A/A gate is what found
     * it: two captures of the SAME server differed on 48 of 810 shots, by between 1 and 18 pixels
     * each, all of them on a text baseline or the straight edge of a card border. Nothing about
     * the page had changed — the computed-style dumps were identical — so what varied was how the
     * pixels were rasterised, which by default depends on subpixel text positioning, on LCD
     * (RGB-fringed) antialiasing, on which raster thread got a tile, and on partial re-raster of a
     * document that is twelve thousand pixels tall.
     *
     * Each flag below turns off one of those. They cost fidelity — grayscale antialiasing is not
     * quite what a user sees — and that is the right trade for this harness and only for this
     * harness: the question is never "is this pretty", it is "did these two stylesheets produce
     * the same layout and colour", and a renderer that answers it differently twice in a row
     * cannot answer it at all. RE-RUN THE A/A GATE after touching this list.
     */
    launchOptions: {
      args: [
        '--disable-lcd-text',
        '--disable-font-subpixel-positioning',
        '--font-render-hinting=none',
        '--force-color-profile=srgb',
        '--disable-partial-raster',
        '--disable-checker-imaging',
        '--disable-image-animation-resync',
        '--disable-threaded-animation',
        '--disable-threaded-scrolling',
        '--disable-skia-runtime-opts',
        '--num-raster-threads=1',
        '--disable-gpu'
      ]
    }
  },
  // One project, and its device descriptor is only here for the user-agent: every context the
  // harness takes a shot in is built by `themedContext`, which pins the viewport, the device scale
  // factor, the colour scheme and the reduced-motion preference itself.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
