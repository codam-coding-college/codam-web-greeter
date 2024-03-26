import fs from 'fs';
import express from 'express';
import { ExamForHost, Exam42 } from './interfaces';
import ipRangeCheck from 'ip-range-check';
import dns from 'dns';

export const EXAM_MODE_ENABLED = process.env.EXAM_MODE_ENABLED === 'true' || false;

export const parseIpRanges = function(ipRanges: string): string[] {
	const ranges = ipRanges.split(',');
	const trimmedRanges = ranges.map((range) => range.trim()); // trim whitespace
	const filteredRanges = trimmedRanges.filter((range) => range.length > 0); // remove empty strings
	return filteredRanges;
}

export const ipToHostName = async function(ip: string): Promise<string | null> {
	const reverse = await dns.promises.reverse(ip)
		.then((result) => {
			return result[0]
		})
		.catch((err) => {
			console.error(err)
			return null
		})
	return reverse
};

export const hostNameToIp = async function(hostName: string): Promise<string | null> {
	const ip = await dns.promises.lookup(hostName)
		.then((result) => {
			return result.address
		})
		.catch((err) => {
			console.error(err)
			return null
		})
	return ip	
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

export const getHostNameFromRequest = async function(req: express.Request): Promise<string> {
	// Get hostname from request
	let hostname = req.params.hostname ?? 'unknown';

	// If hostname is not defined, parse it from the IP address
	if (hostname === 'unknown') {
		const ip = getIpFromRequest(req);
		if (ip) {
			const parsedHostName = await ipToHostName(ip);
			hostname = parsedHostName ?? hostname;
		}
	}

	return hostname;
};

export const getExamForHost = function(exams: Exam42[], hostIp: string): ExamForHost[] {
	if (!EXAM_MODE_ENABLED) {
		return [];
	}

	const examForHost: ExamForHost[] = [];
	exams.forEach((exam) => {
		if (examAvailableForHost(exam, hostIp)) {
			examForHost.push({
				id: exam.id,
				name: exam.name,
				begin_at: exam.begin_at,
				end_at: exam.end_at,
			});
		}
	});
	return examForHost;
};

export const examAvailableForHost = function(exam: Exam42, hostIp: string): boolean {
	for (const ipRange of exam.ip_range) {
		if (ipRangeCheck(hostIp, ipRange)) {
			return true;
		}
	}
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

export const getExamForHostName = async function(exams: Exam42[], hostName: string): Promise<ExamForHost[]> {
	console.log('getExamForHostName')
	if (hostName === 'unknown') {
		console.warn('Hostname is unknown, unable to find exams for host');
		return [];
	}
	const hostIp = await hostNameToIp(hostName);
	if (!hostIp) {
		console.warn(`Could not parse IP address from hostname "${hostName}", unable to find exams for host`);
		return [];
	}
	return getExamForHost(exams, hostIp);
};

export const getMessageForHostName = async function(hostName: string): Promise<string> {
	console.log('getMessageForHostName')
	if (hostName === 'unknown') {
		console.warn('Hostname is unknown, unable to find messages for host');
		return "";
	}
	const hostIp = await hostNameToIp(hostName);
	if (!hostIp) {
		console.warn(`Could not parse IP address from hostname "${hostName}", unable to find messages for host`);
		return "";
	}

	// Read messages.json
	// TODO: implement caching for messages
	const messages = fs.readFileSync('messages.json', 'utf8');
	const messagesJson = JSON.parse(messages);
	if (!messagesJson) {
		console.warn('Could not parse messages.json, unable to find messages for host');
		return "";
	}

	// Find messages for host
	// Any message with a key that the hostname starts with will be returned
	const hostMessages = [];
	for (const key in messagesJson) {
		if (hostName.startsWith(key)) {
			hostMessages.push(messagesJson[key]);
		}
	}

	// Combine all messages into one
	return hostMessages.join('\n\n');
}
