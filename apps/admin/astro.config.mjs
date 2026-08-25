// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

import svelte from "@astrojs/svelte";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
	site: "https://harkagroup.id",
	base: "/",
	integrations: [mdx(), svelte(), icon()],
	output: "server",
	adapter: cloudflare({ persistState: { path: "../../.wrangler/state" } }),
	vite: {
		plugins: [tailwindcss()],
	},
});
