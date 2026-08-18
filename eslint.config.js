import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

// Shared by every block below — a rule that only holds in some of the source tree is a rule
// with a hole in it, which is exactly the gap this config used to have around playwright/.
const noUnusedVars = ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }];

// KEY RULE: Catch shorthand properties in conditional spreads.
const noShorthandInConditionalSpread = [
  'error',
  {
    selector: 'SpreadElement > LogicalExpression[operator="&&"] > ObjectExpression > Property[shorthand=true]',
    message:
      'Avoid shorthand properties in conditional spreads. Use explicit { field_name: value } to prevent property name mismatches with API types.'
  },
  {
    selector: 'SpreadElement > ConditionalExpression > ObjectExpression > Property[shorthand=true]',
    message:
      'Avoid shorthand properties in conditional spreads. Use explicit { field_name: value } to prevent property name mismatches with API types.'
  }
];

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignores — generated output and code that is not ours to lint, and nothing else.
  //
  // This list used to carry `*.config.js` and `*.config.ts`, meant for the build tooling at the
  // repo root. That glob matches at any depth and by basename, so it also swallowed
  // `playwright.config.ts` and `playwright/config.ts` — hand-written test code. The build tooling
  // lints clean anyway, so the exemption bought nothing and hid two files. Lint everything.
  {
    ignores: [
      '.svelte-kit/**',
      'build/**',
      'node_modules/**',
      'src/generated/**',
      'playwright/generated/**',
      // Reviewable evaluates this as a function body with `review` in scope, not as a module.
      '.reviewable/**'
    ]
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript files (server-side, utils, etc.). Playwright is excluded here and configured
  // below: its files belong to a different tsconfig, so type-aware linting them against
  // ./tsconfig.json is a parse error, not a lint.
  {
    files: ['**/*.ts'],
    ignores: ['**/*.svelte.ts', 'playwright/**', 'playwright.config.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        App: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': noUnusedVars,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',

      'no-restricted-syntax': noShorthandInConditionalSpread
    }
  },

  // Playwright end-to-end tests. Node-only (no browser globals: the code under test runs in the
  // browser, this code drives it from node), typed against playwright/tsconfig.json, and covering
  // playwright.config.ts because that file is part of the same suite.
  {
    files: ['playwright/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './playwright/tsconfig.json'
      },
      globals: {
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': noUnusedVars,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',

      'no-restricted-syntax': noShorthandInConditionalSpread
    }
  },

  // Svelte TypeScript files (.svelte.ts) - Svelte runes. `*.svelte.test.ts` is here too: the
  // Svelte compiler treats it as a runes module, so a component test may use $state to drive
  // props, and without this block it lints as plain TypeScript and every rune is undefined.
  {
    files: ['**/*.svelte.ts', '**/*.svelte.test.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $bindable: 'readonly',
        $inspect: 'readonly',
        $host: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': noUnusedVars,
      '@typescript-eslint/no-explicit-any': 'error',

      'no-restricted-syntax': noShorthandInConditionalSpread
    }
  },

  // Svelte files - no type-aware linting (tsconfig doesn't include them)
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $bindable: 'readonly',
        $inspect: 'readonly',
        $host: 'readonly'
      }
    },
    plugins: {
      svelte: sveltePlugin,
      '@typescript-eslint': tseslint
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      // KEY RULE: {@html} is the only XSS sink in a Svelte app, and the values that reach our
      // components (names, scraped data, model output) are user-set. Every use must be an
      // explicit, justified exemption naming why the string is app-authored - never a default.
      'svelte/no-at-html-tags': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': noUnusedVars,
      '@typescript-eslint/no-explicit-any': 'error',

      'no-restricted-syntax': noShorthandInConditionalSpread
    }
  },

  // JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    }
  },

  // Disable stylistic rules that conflict with prettier
  prettierConfig
];
