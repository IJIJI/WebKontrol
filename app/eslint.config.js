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
