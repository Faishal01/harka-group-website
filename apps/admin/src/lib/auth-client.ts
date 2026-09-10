import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
	// You can pass a baseURL if needed, but it usually infers from the window
});
