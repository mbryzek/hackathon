// The Power-of-Ten rules for the TypeScript side, as a rule set rather than prose (ISS-5755).
//
// THIS FILE IS THE CANONICAL COPY. Every `svelte.config.js` repo in the fleet carries it
// verbatim at its own root as `eslint.p10.js`, so a rule change is edited here and copied
// out once per repo rather than reinvented eleven times; comparing this file's checksum
// against each repo's copy is the whole answer to whether they are in step. A repo's own
// `eslint.config.js` spreads these sets into its blocks and adds whatever else it needs —
// the shared part is the floor, never the ceiling.
//
// THE RULES ONLY BITE BECAUSE `npm run lint` RUNS INSIDE `npm run check`, and `ci/build.sh`
// runs `npm run check`. An eslint config nothing invokes is decorative; the gate is that
// chain, and `--max-warnings 0` on the lint script is what makes a warning a failure.
//
// Four sets, because only two things vary between config blocks:
//
//   `typed`   — everything. Valid ONLY on a block carrying a `project` (or `projectService`),
//               because `no-floating-promises` reads types. On a block without one eslint
//               refuses to load the rule outright, which is the good failure: a gate that
//               reported green having measured nothing would be the bad one.
//   `untyped` — the same set minus that one rule, for files no tsconfig covers.
//   `svelte`  — `typed`, with core `prefer-const` swapped for the Svelte-aware one.
//   `tests`   — what a test file relaxes, applied to `testFiles`.

/** Every P10 rule that needs no type information. */
export const untyped = {
  // P10 rule 4 — a function you cannot see at once is a function you cannot check.
  'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],

  // P10 rule 6 — declare at the narrowest scope, and never re-bind what never changes.
  'prefer-const': 'error',
  'no-var': 'error',

  // P10 rule 10 — `any` switches the compiler off for everything downstream of it, so one
  // `any` costs far more type checking than the expression it sits on.
  '@typescript-eslint/no-explicit-any': 'error'
};

/** Every P10 rule, including the one that reads types. */
export const typed = {
  ...untyped,

  // P10 rules 7 and 9 — an unawaited promise drops its rejection on the floor: nothing reaches
  // the caller, and the caller returns a success it never had. This is the rule the whole
  // type-aware setup exists for.
  '@typescript-eslint/no-floating-promises': 'error'
};

/**
 * `typed`, for `.svelte` components.
 *
 * `let { a, b } = $props()` is the documented Svelte 5 form, and a `$bindable` prop must stay
 * `let` because the child writes through it. Neither is a reassignment core `prefer-const` can
 * see, so it demands a `const` that breaks the component; `svelte/prefer-const` knows the runes
 * and skips exactly those declarations.
 */
export const svelte = {
  ...typed,
  'prefer-const': 'off',
  'svelte/prefer-const': 'error'
};

/** The files `tests` applies to. Shared so the exemption cannot drift into covering app code. */
export const testFiles = ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js', '**/*.svelte.test.ts'];

/**
 * What a test file relaxes — and it is one rule.
 *
 * `describe(...)` is an arrow function to the linter and a heading to the reader, so
 * `max-lines-per-function` measures the size of a SECTION here rather than the size of
 * anything anyone has to hold in their head. Splitting a suite to satisfy it moves cases away
 * from the description they belong under, which is a readability loss dressed as a win. Every
 * other rule stays on: a floating promise in a test is a test that passes without waiting for
 * what it asserts, which is worse here than in app code, not better.
 */
export const tests = {
  'max-lines-per-function': 'off'
};
