import js from "@eslint/js";
import ts from "typescript-eslint";
import astro from "eslint-plugin-astro";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import path from "node:path";

const gitignorePath = path.resolve(import.meta.dirname, "../../.gitignore");

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	astro.configs.recommended,
	svelte.configs["flat/recommended"],
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
			},
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
			"no-undef": "off", // TypeScript already checks this, and avoids false positives in Svelte/Astro
			"astro/no-exports-from-components": "warn",
			"astro/no-prerender-export-outside-pages": "warn",
			"svelte/require-each-key": "warn",
			"@typescript-eslint/ban-ts-comment": "warn",
			"no-useless-assignment": "warn",
			"@typescript-eslint/triple-slash-reference": "warn",
			"@typescript-eslint/no-empty-object-type": "warn",
		},
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
			},
		},
	},
	{
		ignores: ["public/", "worker-configuration.d.ts"],
	},
);
