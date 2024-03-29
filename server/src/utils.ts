import fs from 'fs';
import express from 'express';
import { ExamForHost, Exam42 } from './interfaces';
import ipRangeCheck from 'ip-range-check';
import dns from 'dns';

export const EXAM_MODE_ENABLED = process.env.EXAM_MODE_ENABLED === 'true' || false;

export const parseIpRanges = function(ipRanges: string): string[] {
	return ipRanges.split(',').map((range) => range.trim()).filter((range) => range.length > 0);
}

export const ipToHostName = async function(ip: string): Promise<string | null> {
	try {
		const result = await dns.promises.reverse(ip);
		return result[0];
	} catch (err) {
		console.error(err);
		return null;
	}
};

export const hostNameToIp = async function(hostName: string): Promise<string | null> {
	try {
		const result = await dns.promises.lookup(hostName);
		return result.address;
	}
	catch (err) {
		console.error(err);
		return null;
	}
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
	let hostname = req.hostname ?? 'unknown';

	// If hostname is not defined, parse it from the IP address
	if (hostname === 'unknown') {
		const ip = getIpFromRequest(req);
		if (ip) {
			hostname = await ipToHostName(ip) ?? hostname;
		}
	}

	return hostname;
};

export const getExamForHost = function(exams: Exam42[], hostIp: string): ExamForHost[] {
	if (!EXAM_MODE_ENABLED) {
		return [];
	}

	return exams.filter((exam) => examAvailableForHost(exam, hostIp))
		.map((exam) => ({
			id: exam.id,
			name: exam.name,
			begin_at: exam.begin_at,
			end_at: exam.end_at,
		}));
};

export const examAvailableForHost = function(exam: Exam42, hostIp: string): boolean {
	return exam.ip_range.some(ipRange => ipRangeCheck(hostIp, ipRange));
};

export const getCurrentExams = function(exams: Exam42[]): Exam42[] {
	const now = new Date();
	return exams.filter((exam) => exam.begin_at < now && exam.end_at > now);
};

export const getExamForHostName = async function(exams: Exam42[], hostName: string): Promise<ExamForHost[]> {
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
	if (hostName === 'unknown') {
		console.warn('Hostname is unknown, unable to find messages for host');
		return "";
	}
	const hostIp = await hostNameToIp(hostName);
	if (!hostIp) {
		console.warn(`Could not parse IP address from hostname "${hostName}", unable to find messages for host`);
		return "";
	}

	try {
		// Read messages.json
		// TODO: implement caching for messages
		const messagesJson = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
		if (!messagesJson) {
			console.warn('Could not parse messages.json, unable to find messages for host');
			return "";
		}
	
		// Find messages for host
		// Any message with a key that the hostname starts with will be returned
		const hostMessages = Object.entries(messagesJson)
			.filter(([key]) => hostName.startsWith(key))
			.map(([, message]) => message);
	
		// Combine all messages into one
		return hostMessages.join('\n\n');
	} catch (error) {
		console.error(error);
		return "";
	}
}
