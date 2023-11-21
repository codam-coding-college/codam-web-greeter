import { Express } from 'express';
import { Config, ConfigError, Event42, Exam42 } from './interfaces';
import { getCurrentExams, getExamForHostName, getHostNameFromRequest, hostNameToIp, examAvailableForHost } from './utils';
import { fetchEvents, fetchExams } from './intra';
import Api42 from '@codam/fast42';
import NodeCache from 'node-cache';

const FOUND_HOSTS: string[] = [];

export default (app: Express, cache: NodeCache, api: Api42 | undefined) => {
	app.get('/', (req, res) => {
		res.send({ status: 'ok' });
	});

	app.get('/api/config/:hostname?', async (req, res) => {
		const hostname = getHostNameFromRequest(req);

		let events = cache.get<Event42[]>('events');
		let exams = cache.get<Exam42[]>('exams');
		let lastCacheChange = cache.get<Date>('last-cache-change');

		if (!events && api) {
			events = await fetchEvents(api);
			cache.set('events', events);
			cache.set('last-cache-change', new Date());
		}
		if (!exams && api) {
			exams = await fetchExams(api);
			cache.set('exams', exams);
			cache.set('last-cache-change', new Date());
		}

		if (events === undefined || exams === undefined) {
			console.log('No data to return for config request');
			const cError: ConfigError = { error: 'No data to return, try again later' };
			return res.status(503).send(cError);
		}

		if (!(hostname in FOUND_HOSTS)) {
			console.log(`Found new hostname: ${hostname}`);
			FOUND_HOSTS.push(hostname);
		}

		const config: Config = {
			hostname: hostname,
			events: events,
			exams: exams,
			exams_for_host: getExamForHostName(exams, hostname),
			fetch_time: lastCacheChange ?? new Date(),
		};
		res.send(config);
	});

	app.get('/api/exam_mode_hosts', async (req, res) => {
		// Check cache first
		if (cache.has('examModeHosts')) {
			return res.send({ examModeHosts: cache.get<string[]>('examModeHosts'), status: 'ok' });
		}

		// Get the current exams
		let exams = cache.get<Exam42[]>('exams');
		if (!exams && api) {
			exams = await fetchExams(api);
			cache.set('exams', exams);
			cache.set('last-cache-change', new Date());
		}
		if (exams === undefined) {
			return res.status(503).send({ error: 'No data to return, try again later', status: 'error' });
		}
		const currentExams = getCurrentExams(exams);
		if (currentExams.length === 0) {
			return res.send({ examModeHosts: [], message: 'No exams are currently running', status: 'ok' });
		}

		// Calculate which hosts are in exam mode
		const examModeHosts: string[] = [];
		for (const hostname in FOUND_HOSTS) {
			const ipAddress = hostNameToIp(hostname);
			if (!ipAddress) {
				continue;
			}
			for (const exam of currentExams) {
				if (examAvailableForHost(exam, ipAddress)) {
					examModeHosts.push(hostname);
					break;
				}
			}
		}

		// Save to cache and return data
		cache.set('examModeHosts', examModeHosts, 10); // 10 second cache
		return res.send({ examModeHosts: examModeHosts, status: 'ok' });
	});
};
