import gasPlugin from "@gas-plugin/unplugin/vite";
import { defineConfig } from "vite";
import { APP_VERSION } from "./version.ts";

export default defineConfig({
	plugins: [gasPlugin()],
	define: {
		__APP_VERSION__: JSON.stringify(APP_VERSION),
	},
	build: {
		emptyOutDir: false,
		lib: {
			entry: "src/script/main.ts",
			formats: ["es"],
			fileName: () => "Code.js",
		},
	},
});
