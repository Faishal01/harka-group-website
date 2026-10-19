import gasPlugin from "@gas-plugin/unplugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [gasPlugin()],
	build: {
		emptyOutDir: false,
		lib: {
			entry: "src/script/main.ts",
			formats: ["es"],
			fileName: () => "Code.js",
		},
	},
});
