import { Express } from 'express';
import { Config, ConfigError, Event42, Exam42 } from './interfaces';
import { getCurrentExams, getExamForHostName, getHostNameFromRequest, hostNameToIp, examAvailableForHost, getMessageForHostName } from './utils';
import { fetchEvents, fetchExams, fetchUserImage } from './intra';

// Intra API
import Fast42 from '@codam/fast42';
let api: Fast42 | undefined = undefined;

// Set up caching
import NodeCache from 'node-cache';
const cacheTTL = 900; // 15 minutes
const cache = new NodeCache({ stdTTL: cacheTTL });

const FOUND_HOSTS: string[] = [];

export default (app: Express) => {
	// Initialize
	setUpIntraAPI();

	// Define routes
	app.get('/', (req, res) => {
		res.send({ status: 'ok' });
	});

	app.get('/api/config/:hostname?', async (req, res) => {
		const hostname = await getHostNameFromRequest(req);

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

		if (FOUND_HOSTS.includes(hostname) === false) {
			console.log(`Found new hostname: ${hostname}`);
			FOUND_HOSTS.push(hostname);
		}

		const config: Config = {
			hostname: hostname,
			events: events,
			exams: exams,
			exams_for_host: await getExamForHostName(exams, hostname),
			fetch_time: lastCacheChange ?? new Date(),
			message: await getMessageForHostName(hostname),
		};
		res.send(config);
	});

	app.get('/api/exam_mode_hosts', async (req, res) => {
		// Check cache first
		if (cache.has('examModeHosts')) {
			const ret = cache.get<any>('examModeHosts')
			return res.send(ret);
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
			return res.send({ exam_mode_hosts: [], message: 'No exams are currently running', status: 'ok' });
		}

		// Calculate which hosts are in exam mode
		const examModeHosts: string[] = [];
		for (const hostname of FOUND_HOSTS) {
			const ipAddress = await hostNameToIp(hostname);
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
		const examsInProgressIds = currentExams.map((exam) => exam.id);
		const ret = { exam_mode_hosts: examModeHosts, message: `Exams in progress: ${examsInProgressIds.join(', ')}`, status: 'ok' }
		cache.set('examModeHosts', ret, 5); // 5 second cache
		return res.send(ret);
	});

	app.get('/api/user/:login/.face', async (req, res) => {
		const login = req.params.login;
		if (!login) {
			return res.status(400).send({ error: 'No login provided' });
		}
		if (!api) {
			return res.status(503).send({ error: 'Intra API not initialized' });
		}
		if (cache.has(`user-image-${login}`)) {
			const imageUrl = cache.get<string>(`user-image-${login}`);
			if (imageUrl) {
				return res.redirect(imageUrl);
			}
		}
		const imageUrl = await fetchUserImage(api, login);
		if (!imageUrl) {
			return res.status(404).send({ error: 'User not found or no image set' });
		}
		cache.set(`user-image-${login}`, imageUrl, cacheTTL); // Cache the image URL
		return res.redirect(imageUrl);
	});
};

const setUpIntraAPI = async function() {
	try {
		console.log(`Using Intra API UID: ${process.env.INTRA_API_UID}`);

		api = await new Fast42([{
			client_id: process.env.INTRA_API_UID!,
			client_secret: process.env.INTRA_API_SECRET!,
		}]).init();

		// Fetch initial data
		if (!cache.has('events')) {
			const events = await fetchEvents(api);
			console.log('Fetched future events');
			cache.set('events', events);
			cache.set('last-cache-change', new Date());
		}

		if (!cache.has('exams')) {
			const exams = await fetchExams(api);
			console.log('Fetched future exams');
			cache.set('exams', exams);
			cache.set('last-cache-change', new Date());
		}
	}
	catch(err) {
		console.warn("[WARNING] Could not initialize Intra API, some features might not work");
		console.error(err);
		api = undefined; // unset api
	}
};
