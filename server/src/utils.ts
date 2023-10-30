import express from 'express';

export const parseIpRanges = function(ipRanges: string): string[] {
	const ranges = ipRanges.split(',');
	const trimmedRanges = ranges.map((range) => range.trim()); // trim whitespace
	const filteredRanges = trimmedRanges.filter((range) => range.length > 0); // remove empty strings
	return filteredRanges;
}

export const ipToHostName = function(ip: string): string | null {
	// do not parse ipv6
	if (ip.includes(':')) {
		return null;
	}
	const ipParts = ip.split('.');
	if (ipParts.length !== 4) {
		return null;
	}
	// parse integers
	const parsedParts = ipParts.map((part) => parseInt(part));
	// check if valid
	if (parsedParts.some((part) => isNaN(part))) {
		return null;
	}
	// check if in range
	if (parsedParts[0] !== 10) {
		return null;
	}
	const f = parsedParts[1] - 10;
	const r = parsedParts[2];
	const s = parsedParts[3];
	return `f${f}r${r}s${s}.codam.nl`;
};

export const getHostNameFromRequest = function(req: express.Request): string {
	// Get hostname from request
	let hostname = req.params.hostname ?? 'unknown';

	// If hostname is not defined, parse it from the IP address
	if (hostname === 'unknown') {
		let ip = null;
		if ('x-forwarded-for' in req.headers) {
			if (typeof req.headers['x-forwarded-for'] === 'string') {
				ip = req.headers['x-forwarded-for'].split(',')[0];
			}
			else if (Array.isArray(req.headers['x-forwarded-for'])) {
				ip = req.headers['x-forwarded-for'][0];
			}
		}
		else if ('remoteAddress' in req.socket) {
			ip = req.socket.remoteAddress;
		}

		// Try to parse IP address to hostname
		if (ip) {
			const parsedHostName = ipToHostName(ip);
			hostname = parsedHostName ?? hostname;
		}
	}

	return hostname;
};
