// Typed API client for the VSK archery backend.
//
// One helper, `apiFetch`, hits the backend REST API and returns parsed JSON.
// It forwards the active `?locale=` (defaulting to hr) and throws a typed
// ApiError on non-2xx so callers / +page.ts load functions can surface it via
// SvelteKit's error()/fail(). Response shapes come from `archery-contracts`.
//
// The base URL is PUBLIC_API_BASE_URL (SvelteKit public env), defaulting to the
// local dev backend on :3100. Set PUBLIC_API_BASE_URL in .env for other envs.

import { env } from '$env/dynamic/public';
import { DEFAULT_LOCALE, type Locale } from './locale.ts';

const BASE_URL = env.PUBLIC_API_BASE_URL ?? 'http://localhost:3100';

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

type ApiFetchOptions = {
	/** Active locale; forwarded as ?locale=. Defaults to hr. */
	locale?: Locale;
	/** SvelteKit's load `fetch` (so SSR requests are tracked/credentialed). */
	fetch?: typeof globalThis.fetch;
	/** Extra query params. */
	query?: Record<string, string | number | undefined>;
};

// GET `path` from the backend, parse JSON, return it typed as T.
// Adds ?locale= and any extra query params. Throws ApiError on non-2xx.
export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
	const f = opts.fetch ?? globalThis.fetch;
	const url = new URL(path.replace(/^\//, ''), BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/');

	url.searchParams.set('locale', opts.locale ?? DEFAULT_LOCALE);
	if (opts.query) {
		for (const [k, v] of Object.entries(opts.query)) {
			if (v !== undefined) url.searchParams.set(k, String(v));
		}
	}

	let res: Response;
	try {
		res = await f(url.toString());
	} catch (cause) {
		throw new ApiError(0, `Network error reaching ${url.pathname}`);
	}

	if (!res.ok) {
		// The backend's global error middleware returns { message } JSON.
		let message = `${res.status} ${res.statusText}`;
		try {
			const body = (await res.json()) as { message?: string };
			if (body?.message) message = body.message;
		} catch {
			// non-JSON error body — keep the status line
		}
		throw new ApiError(res.status, message);
	}

	return (await res.json()) as T;
}
