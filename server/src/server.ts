import { Config, Event42, Exam42 } from './interfaces.js';

import dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: true }); // Load .env file

import { getHostNameFromRequest } from './utils.js';
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

	let events = cache.get<Event42[]>(`events`);
	let exams = cache.get<Exam42[]>(`exams`);

	if (!api) {
		res.status(503).send({ error: 'Intra API not initialized yet, try again in a moment' });
		return;
	}

	if (!events) {
		events = await fetchEvents(api);
		cache.set(`events`, events);
	}
	if (!exams) {
		exams = await fetchExams(api);
		cache.set(`exams`, exams);
	}

	const config = {
		hostname: hostname,
		events: events,
		exams: exams,
	};
	res.send(config);
});

// Start server
app.listen(3000, async () => {
	console.log('Server is running on port 3000');

	api = await new Fast42([{
		client_id: process.env.INTRA_API_UID!,
		client_secret: process.env.INTRA_API_SECRET!,
	}]).init();

	const events = await fetchEvents(api);
	console.log('Fetched future events');
	cache.set(`events`, events);

	const exams = await fetchExams(api);
	console.log('Fetched future exams');
	cache.set(`exams`, exams);
});
