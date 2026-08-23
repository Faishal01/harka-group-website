import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import path from "node:path";

const gitignorePath = path.resolve(import.meta.dirname, "../../.gitignore");

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
			},
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
			"no-undef": "off",
			"@typescript-eslint/ban-ts-comment": "warn",
			"no-useless-assignment": "warn",
			"@typescript-eslint/triple-slash-reference": "warn",
			"@typescript-eslint/no-empty-object-type": "warn",
		},
	}
);
