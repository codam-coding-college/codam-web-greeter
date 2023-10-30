import { Config } from './interfaces.js';

import dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: true }); // Load .env file

import { getHostNameFromRequest } from './utils.js';
import express from 'express';
import { fetchEvents, fetchExams } from './intra.js';
import Fast42 from '@codam/fast42';

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

	const config = {
		hostname: hostname,
		events: [],
		exams: [
			// Temporary fake data
			{
				name: 'Exam 1',
				start: '2021-01-01T00:00:00.000Z',
				end: '2021-01-01T00:00:00.000Z',
				session: {
					username: 'exam',
					password: 'exam'
				}
			}
		]
	};
	res.send(config);
});

// Start server
app.listen(3000, async () => {
	console.log('Server is running on port 3000');

	const api = await new Fast42([
		{
			client_id: process.env.INTRA_API_UID!,
			client_secret: process.env.INTRA_API_SECRET!,
		}
	]).init();

	const events = await fetchEvents(api);
	console.log('Fetched future events');

	const exams = await fetchExams(api);
	console.log('Fetched future exams');
});
