// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import tsdoc from "eslint-plugin-tsdoc";


// TODO:
// tseslint.configs.strict,
// tseslint.configs.stylistic,

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", ".pnp.*", ".vscode/**", ".yarn/**", "db/**", "logs/**"],
  },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  
  // JS files: disable type-checked rules (no tsconfig coverage)
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },

  // TypeScript files: type-aware analysis + TSDoc
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { tsdoc },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "tsdoc/syntax": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        // Static Readonly fields
        // Must be UPPER_CASE (e.g., static readonly MAX_RETRIES = 3;)
        {
          "selector": "classProperty",
          "modifiers": ["static", "readonly"],
          "format": ["UPPER_CASE"],
          "leadingUnderscore": "forbid"
        },

        {
          "selector": "classProperty",
          "modifiers": ["private", "static", "readonly"],
          "format": ["UPPER_CASE"],
          "leadingUnderscore": "forbid"
        },

        // Private Class Members
        // Must be _camelCase
        {
          "selector": ["classProperty", "classMethod", "accessor"],
          "modifiers": ["private"],
          "format": ["camelCase"],
          "leadingUnderscore": "require"
        },
        // Protected Class Members
        // Must be _camelCase
        {
          "selector": ["classProperty", "classMethod", "accessor"],
          "modifiers": ["protected"],
          "format": ["camelCase"],
          "leadingUnderscore": "require"
        },
        // Public Class Members (Default for classes)
        // Must be camelCase
        {
          "selector": ["classProperty", "classMethod", "accessor"],
          "format": ["camelCase"],
          "leadingUnderscore": "forbid"
        },
        // Enum Members
        // Must be UPPER_CASE (e.g., enum Status { ACTIVE, INACTIVE })
        {
          "selector": "enumMember",
          "format": ["UPPER_CASE"]
        },
        // Functions
        // Must be camelCase
        {
          "selector": "function",
          "format": ["camelCase"],
          "leadingUnderscore": "allow"
        },
        // Type Properties (Interfaces and Type Aliases)
        // Allows camelCase, or snake_case for event-like fields. 
        // (Note: kebab-case is handled by rule #1 if wrapped in quotes)
        {
          "selector": "typeProperty",
          "format": ["camelCase", "snake_case"],
          "leadingUnderscore": "allow"
        }
      ]
    },
  },

  // UI files: React rules
  {
    files: ["ui/src/**/*.tsx", "ui/src/**/*.ts"],
    plugins: { "react-hooks": reactHooks, react },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // These v7 rules are too strict for patterns used throughout the codebase
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      // Not needed with the new JSX transform (React 17+)
      "react/react-in-jsx-scope": "off",
      // Redundant with TypeScript
      "react/prop-types": "off",
    },
  },
);
