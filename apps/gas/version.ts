import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Hardcoded MAJOR and PATCH version
export const MAJOR = 0;
export const PATCH = 0;

/**
 * Derives the MINOR version dynamically from the latest deployment number + 1.
 * Falls back gracefully to 1 if clasp is unreachable or offline.
 */
export function getMinorVersion(): number {
	const baseDir = import.meta.dirname || process.cwd();
	const cacheFile = path.resolve(baseDir, ".version-cache.json");
	try {
		if (fs.existsSync(cacheFile)) {
			const stat = fs.statSync(cacheFile);
			// Reuse cached deployment count if less than 60 seconds old
			if (Date.now() - stat.mtimeMs < 60000) {
				const data = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
				if (typeof data.minor === "number") {
					return data.minor;
				}
			}
		}
	} catch {
		// Ignore cache read errors
	}

	let minor = 1;
	try {
		const out = execSync("bun run clasp deployments", {
			timeout: 5000,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
		const match = out.match(/Found (\d+) deployments/);
		if (match) {
			minor = parseInt(match[1], 10) + 1;
		} else {
			const nums = [...out.matchAll(/@(\d+)/g)].map((m) => parseInt(m[1], 10));
			if (nums.length) {
				minor = Math.max(...nums) + 1;
			}
		}
	} catch {
		// Fallback
	}

	try {
		fs.writeFileSync(cacheFile, JSON.stringify({ minor }), "utf8");
	} catch {
		// Ignore cache write errors
	}

	return minor;
}

export const MINOR = getMinorVersion();
export const APP_VERSION = `v${MAJOR}.${MINOR}.${PATCH}`;
