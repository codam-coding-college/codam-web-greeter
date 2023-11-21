import dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: true }); // Load .env file

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
import routes from './routes.js';
routes(app, cache, api);

// Start server
app.listen(3000, async () => {
	console.log('Server is running on port 3000');

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
});
