import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignores
  {
    ignores: [
      ".svelte-kit/**",
      "build/**",
      "node_modules/**",
      "src/generated/**",
      "*.config.js",
      "*.config.ts",
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript files (server-side, utils, etc.)
  {
    files: ["**/*.ts"],
    ignores: ["**/*.svelte.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        App: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "error",

      // KEY RULE: Catch shorthand properties in conditional spreads
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'SpreadElement > LogicalExpression[operator="&&"] > ObjectExpression > Property[shorthand=true]',
          message:
            "Avoid shorthand properties in conditional spreads. Use explicit { field_name: value } to prevent property name mismatches with API types.",
        },
        {
          selector:
            'SpreadElement > ConditionalExpression > ObjectExpression > Property[shorthand=true]',
          message:
            "Avoid shorthand properties in conditional spreads. Use explicit { field_name: value } to prevent property name mismatches with API types.",
        },
      ],
    },
  },

  // Svelte TypeScript files (.svelte.ts) - Svelte runes
  {
    files: ["**/*.svelte.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        $state: "readonly",
        $derived: "readonly",
        $effect: "readonly",
        $props: "readonly",
        $bindable: "readonly",
        $inspect: "readonly",
        $host: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      "no-restricted-syntax": [
        "error",
        {
          selector:
            'SpreadElement > LogicalExpression[operator="&&"] > ObjectExpression > Property[shorthand=true]',
          message:
            "Avoid shorthand properties in conditional spreads. Use explicit { field_name: value } to prevent property name mismatches with API types.",
        },
        {
          selector:
            'SpreadElement > ConditionalExpression > ObjectExpression > Property[shorthand=true]',
          message:
            "Avoid shorthand properties in conditional spreads. Use explicit { field_name: value } to prevent property name mismatches with API types.",
        },
      ],
    },
  },

  // Svelte files - no type-aware linting (tsconfig doesn't include them)
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        $state: "readonly",
        $derived: "readonly",
        $effect: "readonly",
        $props: "readonly",
        $bindable: "readonly",
        $inspect: "readonly",
        $host: "readonly",
      },
    },
    plugins: {
      svelte: sveltePlugin,
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // KEY RULE: Catch shorthand properties in conditional spreads
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'SpreadElement > LogicalExpression[operator="&&"] > ObjectExpression > Property[shorthand=true]',
          message:
            "Avoid shorthand properties in conditional spreads. Use explicit { field_name: value } to prevent property name mismatches with API types.",
        },
        {
          selector:
            'SpreadElement > ConditionalExpression > ObjectExpression > Property[shorthand=true]',
          message:
            "Avoid shorthand properties in conditional spreads. Use explicit { field_name: value } to prevent property name mismatches with API types.",
        },
      ],
    },
  },

  // JavaScript files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
