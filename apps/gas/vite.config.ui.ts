import { resolve } from "node:path";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
	plugins: [preact(), viteSingleFile()],
	root: "src/ui",
	build: {
		outDir: "../../dist",
		emptyOutDir: false,
	},
});
