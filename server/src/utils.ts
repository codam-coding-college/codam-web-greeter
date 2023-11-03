import express from 'express';
import { ExamForHost, Exam42 } from './interfaces';
import ipRangeCheck from 'ip-range-check';

export const EXAM_SESSION_USERNAME = process.env.EXAM_SESSION_USERNAME ?? 'exam';
export const EXAM_SESSION_PASSWORD = process.env.EXAM_SESSION_PASSWORD ?? 'exam';

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

export const hostNameToIp = function(hostName: string): string | null {
	const match = hostName.match(/f(\d+)r(\d+)s(\d+)\.codam\.nl/);
	if (!match) {
		return null;
	}
	const f = parseInt(match[1]);
	const r = parseInt(match[2]);
	const s = parseInt(match[3]);
	if (isNaN(f) || isNaN(r) || isNaN(s)) {
		return null;
	}
	return `10.${f + 10}.${r}.${s}`;
}

export const getIpFromRequest = function(req: express.Request): string | null {
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
	return ip ?? null;
}

export const getHostNameFromRequest = function(req: express.Request): string {
	// Get hostname from request
	let hostname = req.params.hostname ?? 'unknown';

	// If hostname is not defined, parse it from the IP address
	if (hostname === 'unknown') {
		const ip = getIpFromRequest(req);
		if (ip) {
			const parsedHostName = ipToHostName(ip);
			hostname = parsedHostName ?? hostname;
		}
	}

	return hostname;
};

export const getExamForHost = function(exams: Exam42[], hostIp: string): ExamForHost[] {
	const examForHost: ExamForHost[] = [];
	exams.forEach((exam) => {
		exam.ip_range.forEach((ipRange) => {
			if (ipRangeCheck(hostIp, ipRange)) {
				examForHost.push({
					id: exam.id,
					name: exam.name,
					begin_at: exam.begin_at,
					end_at: exam.end_at,
					session: {
						username: EXAM_SESSION_USERNAME,
						password: EXAM_SESSION_PASSWORD,
					},
				});
			}
		});
	});
	return examForHost;
};

export const getExamForHostName = function(exams: Exam42[], hostName: string): ExamForHost[] {
	if (hostName === 'unknown') {
		console.warn('Hostname is unknown, unable to find exams for host');
		return [];
	}
	const hostIp = hostNameToIp(hostName);
	if (!hostIp) {
		console.warn(`Could not parse IP address from hostname "${hostName}", unable to find exams for host`);
		return [];
	}
	return getExamForHost(exams, hostIp);
};
