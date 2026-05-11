import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Load .env.version at build time via Vite. Returns empty object if absent.
// The "/" is the project root; glob handles missing files by returning {}.
const versionFiles = import.meta.glob('/.env.version', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

interface VersionInfo {
	version: string | null;
	released_at: string | null;
}

function parseEnvVersion(raw: string | undefined): VersionInfo {
	if (!raw) {
		return { version: null, released_at: null };
	}
	const result: Record<string, string> = {};
	for (const line of raw.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		result[key] = value;
	}
	return {
		version: result['PUBLIC_VERSION'] ?? null,
		released_at: result['PUBLIC_RELEASED_AT'] ?? null,
	};
}

const cached: VersionInfo = parseEnvVersion(Object.values(versionFiles)[0]);

export const GET: RequestHandler = async () => {
	return json(cached);
};
