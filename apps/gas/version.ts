import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Hardcoded MAJOR and PATCH version
export const MAJOR = 0;
export const PATCH = 0;

/**
 * Derives the MINOR version dynamically from the latest clasp version number + 1.
 * Google Apps Script versions increment monotonically without the 20-deployment cap.
 * Falls back gracefully to cache if clasp is unreachable or offline.
 */
export function getMinorVersion(): number {
	const baseDir = import.meta.dirname || process.cwd();
	const cacheFile = path.resolve(baseDir, ".version-cache.json");
	let cachedMinor = 1;

	try {
		if (fs.existsSync(cacheFile)) {
			const stat = fs.statSync(cacheFile);
			const data = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
			if (typeof data.minor === "number") {
				cachedMinor = data.minor;
				// Reuse cached version count if less than 60 seconds old
				if (Date.now() - stat.mtimeMs < 60000) {
					return cachedMinor;
				}
			}
		}
	} catch {
		// Ignore cache read errors
	}

	let minor = cachedMinor;
	try {
		const out = execSync("bun run clasp versions", {
			cwd: baseDir,
			timeout: 30000,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});

		// Check for "Found X versions"
		const match = out.match(/Found (\d+) versions/);
		if (match) {
			minor = parseInt(match[1], 10) + 1;
		} else {
			// Alternatively parse the highest numbered version line e.g. "24 - No description"
			const nums = [...out.matchAll(/^\s*(\d+)\s*-\s*/gm)].map((m) => parseInt(m[1], 10));
			if (nums.length) {
				minor = Math.max(...nums) + 1;
			}
		}
	} catch {
		// Fallback to cachedMinor if offline
		minor = cachedMinor;
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
