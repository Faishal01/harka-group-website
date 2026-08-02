// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-hyperdrive.netlify.app",
  base: "/",
  integrations: [mdx()],
  output: "static",
  adapter: cloudflare(),
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },
});
