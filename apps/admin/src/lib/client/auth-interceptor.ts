interface CustomWindow extends Window {
	__authInterceptorInstalled?: boolean;
}

/**
 * Global fetch interceptor for Harka Admin
 *
 * 1. Dispatches 'auth:session-expired' when any API call returns 401 Unauthorized.
 * 2. Safeguards response.json() so that HTML error pages (e.g. Cloudflare 413, 502,
 *    or login redirects) never throw cryptic 'Unexpected token <, "<!DOCTYPE"' errors,
 *    converting them into clear, actionable Indonesian messages.
 */
export function initAuthInterceptor() {
	if (typeof window === "undefined") return;
	const win = window as unknown as CustomWindow;
	if (win.__authInterceptorInstalled) return;
	win.__authInterceptorInstalled = true;

	const originalFetch = window.fetch;

	function wrapResponse(res: Response): Response {
		const originalJson = res.json.bind(res);
		const originalClone = res.clone.bind(res);

		res.json = async () => {
			try {
				return await originalJson();
			} catch (err) {
				if (res.status === 401) {
					throw new Error("Sesi login Anda telah berakhir. Silakan login kembali.", {
						cause: err,
					});
				}
				if (res.status === 403) {
					throw new Error("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.", {
						cause: err,
					});
				}
				if (res.status === 413) {
					throw new Error("Ukuran berkas terlalu besar. Silakan gunakan foto yang lebih kecil.", {
						cause: err,
					});
				}
				if (!res.ok) {
					const statusText = res.statusText ? ` ${res.statusText}` : "";
					throw new Error(`Server mengalami kendala (${res.status}${statusText}).`, {
						cause: err,
					});
				}
				throw new Error("Format data dari server tidak terduga.", { cause: err });
			}
		};

		res.clone = () => {
			const cloned = originalClone();
			return wrapResponse(cloned);
		};

		return res;
	}

	window.fetch = async function (...args) {
		const res = await originalFetch.apply(this, args);

		// If unauthorized and user is not already on /login
		if (res.status === 401 && window.location.pathname !== "/login") {
			const requestUrl = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
			window.dispatchEvent(
				new CustomEvent("auth:session-expired", {
					detail: { url: requestUrl, status: 401 },
				}),
			);
		}

		return wrapResponse(res);
	};
}
