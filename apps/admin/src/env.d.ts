/// <reference types="astro/client" />
import "../.astro/types.d.ts";

declare global {
	namespace App {
		interface Locals {
			user: import("better-auth").User | null;
			session: import("better-auth").Session | null;
		}
	}
}

export {};
