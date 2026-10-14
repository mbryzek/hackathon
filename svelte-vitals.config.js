// svelte-vitals (ci/build.sh gates on it, ISS-15600). Only the correctness,
// security and a11y rules gate the build; seo, performance and architecture
// fire once per route and are not what this gate is for.
// The config file has no category key, so every rule outside the gated
// categories is turned off by id — a rule a later release adds lands in the
// right half on its own.
import { knownRuleIds } from 'svelte-vitals';

const GATED = new Set(['correctness', 'security', 'a11y']);

export default {
  failOn: 'warning',
  rules: Object.fromEntries(
    knownRuleIds()
      .filter((id) => !GATED.has(id.split('/')[0]))
      .map((id) => [id, 'off'])
  )
};
