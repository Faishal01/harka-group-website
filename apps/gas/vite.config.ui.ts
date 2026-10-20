import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

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
	root: "src/ui",
	build: {
		outDir: "../../dist",
		emptyOutDir: false,
	},
});
