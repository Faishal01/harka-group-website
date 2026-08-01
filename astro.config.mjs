// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-hyperdrive.netlify.app",
  base: "/",
  integrations: [mdx()],
  output: "static",
  devToolbar: {
    enabled: false,
  },
  adapter: netlify(),
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },
});
