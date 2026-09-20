const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Generates a compact, URL-safe random ID (default: 12 chars).
 * Compatible with Node.js, Bun, and Cloudflare Workers runtime.
 */
export function generateCarId(size = 12): string {
	const bytes = new Uint8Array(size);
	crypto.getRandomValues(bytes);
	let id = "";
	for (let i = 0; i < size; i++) {
		id += ALPHABET[bytes[i] % ALPHABET.length];
	}
	return id;
}

export const generateId = generateCarId;

