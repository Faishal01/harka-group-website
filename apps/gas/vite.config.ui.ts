import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { APP_VERSION } from "./version.ts";

export default defineConfig({
	plugins: [
		tailwindcss(),
		preact(),
		Icons({
			compiler: "jsx",
			jsx: "preact",
		}),
		viteSingleFile(),
	],
	define: {
		__APP_VERSION__: JSON.stringify(APP_VERSION),
	},
	root: "src/ui",
	build: {
		outDir: "../../dist",
		emptyOutDir: false,
	},
});
