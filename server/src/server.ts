import dotenv from 'dotenv';
dotenv.config({ path: '.env', debug: true }); // Load .env file

import express from 'express';
import { fetchEvents, fetchExams } from './intra.js';

// Set up express app
const app = express();

// Set up express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up express routes
import routes from './routes.js';
routes(app);

// Start server
app.listen(3000, async () => {
	console.log('Server is running on port 3000');
});
