/// <reference types="astro/client" />
import "../.astro/types.d.ts";

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare global {
	namespace App {
		type Locals = Runtime;
	}
}

export {};
