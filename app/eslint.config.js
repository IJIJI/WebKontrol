// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
    { ignores: ["dist/**", "node_modules/**", ".pnp.*", ".vscode/**", ".yarn/**"] },
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    {
        files: ["ui/src/**/*.tsx", "ui/src/**/*.ts"],
        plugins: { "react-hooks": reactHooks },
        rules: {
            ...reactHooks.configs.recommended.rules,
            // These v7 rules are too strict for patterns used throughout the codebase
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/immutability": "off",
        },
    },
);
