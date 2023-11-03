import { Config, ConfigError, Event42, Exam42 } from './interfaces.js';

import dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: true }); // Load .env file

import { getExamForHostName, getHostNameFromRequest } from './utils.js';
import express from 'express';
import { fetchEvents, fetchExams } from './intra.js';
import Fast42 from '@codam/fast42';
let api: Fast42 | undefined = undefined;
import NodeCache from 'node-cache';

// Set up cache
const cacheTTL = 900; // 15 minutes
const cache = new NodeCache({ stdTTL: cacheTTL });

// Set up express app
const app = express();

// Set up express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up express routes
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
		res.status(503).send(cError);
		return;
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

// Start server
app.listen(3000, async () => {
	console.log('Server is running on port 3000');

	try {
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
});
