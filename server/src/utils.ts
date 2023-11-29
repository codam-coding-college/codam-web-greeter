import express from 'express';
import { ExamForHost, Exam42 } from './interfaces';
import ipRangeCheck from 'ip-range-check';

export const EXAM_SESSION_USERNAME = process.env.EXAM_SESSION_USERNAME ?? 'exam';
export const EXAM_SESSION_PASSWORD = process.env.EXAM_SESSION_PASSWORD ?? 'exam';

export const HOSTNAME_CLUSTER_LETTER = process.env.HOSTNAME_CLUSTER_LETTER ?? 'f'; // in most campuses, it'd be 'c'
export const HOSTNAME_ROW_LETTER = process.env.HOSTNAME_ROW_LETTER ?? 'r';
export const HOSTNAME_SEAT_LETTER = process.env.HOSTNAME_SEAT_LETTER ?? 's';
export const HOSTNAME_SUFFIX = process.env.HOSTNAME_SUFFIX ?? '.codam.nl'; // in most campuses, it'd be empty

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
	return `${HOSTNAME_CLUSTER_LETTER}${f}${HOSTNAME_ROW_LETTER}${r}${HOSTNAME_SEAT_LETTER}${s}${HOSTNAME_SUFFIX}`;
};

export const hostNameToIp = function(hostName: string): string | null {
	const regex = new RegExp(`^${HOSTNAME_CLUSTER_LETTER}(\\d+)${HOSTNAME_ROW_LETTER}(\\d+)${HOSTNAME_SEAT_LETTER}(\\d+)${HOSTNAME_SUFFIX}$`);
	const match = hostName.match(regex);
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
		if (examAvailableForHost(exam, hostIp)) {
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
	return examForHost;
};

export const examAvailableForHost = function(exam: Exam42, hostIp: string): boolean {
	exam.ip_range.forEach((ipRange) => {
		if (ipRangeCheck(hostIp, ipRange)) {
			return true;
		}
	});
	return false;
};

export const getCurrentExams = function(exams: Exam42[]): Exam42[] {
	const currentExams: Exam42[] = [];
	const now = new Date();
	for (const exam of exams) {
		if (exam.begin_at < now && exam.end_at > now) {
			currentExams.push(exam);
		}
	}
	return currentExams;
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
