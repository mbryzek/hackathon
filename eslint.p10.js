// The Power-of-Ten rule set, loaded from the devops release this machine runs (ISS-19732).
//
// THIS FILE IS A LOADER, NOT THE RULES. The rules live once, in devops
// `templates/eslint/eslint.p10.js`, and this file asks `dev ci template` for that file's path
// in the devops release on PATH — the same tree the fleet's verify job builds with. A rule
// change is therefore one devops release and no pull request here. Every SvelteKit repo
// (`dev repo list --family sveltekit`) carries these exact bytes at its root as
// `eslint.p10.js`, copied from devops `templates/eslint/eslint-p10-loader.js`; its
// `eslint.config.js` imports the four sets from it exactly as before.
//
// `dev` ON PATH IS REQUIRED to lint, and its absence is a loud failure rather than a
// silently empty rule set: an editor that cannot find `dev` reports this error instead of
// linting with no Power-of-Ten rules.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const rulesPath = execFileSync('dev', ['ci', 'template', 'eslint/eslint.p10.js'], {
  encoding: 'utf8'
}).trim();

export const { untyped, typed, svelte, testFiles, tests } = await import(pathToFileURL(rulesPath).href);
