// Browser-compatible shim for Node.js url.format
interface UrlFormatOptions {
	protocol?: string;
	hostname?: string;
	pathname?: string;
	query?: Record<string, string | number | boolean | undefined>;
}

export function format(options: UrlFormatOptions): string {
	const { protocol = 'https:', hostname = '', pathname = '', query } = options;

	let url = `${protocol}//${hostname}${pathname}`;

	if (query) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined && value !== null) {
				params.append(key, String(value));
			}
		}
		const queryString = params.toString();
		if (queryString) {
			url += `?${queryString}`;
		}
	}

	return url;
}
