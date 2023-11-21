import Fast42 from '@codam/fast42';
import { Event42, Exam42 } from './interfaces.js';

const CAMPUS_ID = process.env.INTRA_CAMPUS_ID;
const FETCH_EVENTS_UPCOMING_DAYS = 21; // 3 weeks
const EVENT_KINDS_FILTER = [
	'rush', 'piscine', 'partnership', // pedago
	'conference', 'meet_up', 'event', // event
	'association', // association (student's club)
	'hackathon', 'workshop', 'challenge', // speed working
	'extern', // other
];

const fetchAll42 = async function(api: Fast42, path: string, params: { [key: string]: string } = {}): Promise<any[]> {
	return new Promise(async (resolve, reject) => {
		try {
			const pages = await api.getAllPages(path, params);
			console.log(`Retrieving API items: ${pages.length} pages for path ${path}`);

			// Fetch all pages
			let i = 0;
			const pageItems = await Promise.all(pages.map(async (page) => {
				console.log(`Fetching page ${++i}/${pages.length}`);
				const p = await page;
				if (p.status == 429) {
					throw new Error('Intra API rate limit exceeded');
				}
				if (p.ok) {
					const data = await p.json();
					return data;
				}
				else {
					throw new Error(`Intra API error: ${p.status} ${p.statusText}`);
				}
			}));
			return resolve(pageItems.flat());
		}
		catch (err) {
			return reject(err);
		}
	});
};

const getEventDateRange = function(): string {
	const currentDate = new Date();
	const maxFetchDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24 * FETCH_EVENTS_UPCOMING_DAYS);
	return `${currentDate.toISOString()},${maxFetchDate.toISOString()}`;
};

export const fetchEvents = async function(api: Fast42): Promise<Event42[]> {
	try {
		const range = getEventDateRange();
		const ongoingEvents = await fetchAll42(api, `/campus/${CAMPUS_ID}/events`, { 'range[end_at]': range, 'filter[kind]': EVENT_KINDS_FILTER.join(','), 'filter[future]': 'false' });
		const futureEvents = await fetchAll42(api, `/campus/${CAMPUS_ID}/events`, { 'range[begin_at]': range, 'filter[kind]': EVENT_KINDS_FILTER.join(',') });

		// Combine ongoing and future events
		const items = ongoingEvents.concat(futureEvents);

		if (items.length == 0) {
			console.log("No events found");
			return [];
		}

		// Convert to Event42 objects
		const events42: Event42[] = items.map((item) => {
			return new Event42(item);
		});
		events42.sort((a, b) => {
			return a.begin_at.getTime() - b.begin_at.getTime();
		});
		console.log(`Fetched ${events42.length} events`);
		return events42;
	}
	catch(err) {
		console.log(err);
		return [];
	}
};

export const fetchExams = async function(api: Fast42): Promise<Exam42[]> {
	try {
		const range = getEventDateRange();
		const ongoingExams = await fetchAll42(api, `/campus/${CAMPUS_ID}/exams`, { 'range[end_at]': range, 'filter[future]': 'false' });
		const futureExams = await fetchAll42(api, `/campus/${CAMPUS_ID}/exams`, { 'range[begin_at]': range });

		// Combine ongoing and future exams
		const items = ongoingExams.concat(futureExams);

		if (items.length == 0) {
			console.log("No exams found");
			return [];
		}

		// Convert to Exam42 objects
		const exams42: Exam42[] = items.map((item) => {
			return new Exam42(item);
		});
		exams42.sort((a, b) => {
			return a.begin_at.getTime() - b.begin_at.getTime();
		});
		console.log(`Fetched ${exams42.length} exams`);
		return exams42;
	}
	catch(err) {
		console.log(err);
		return [];
	}
};
