import Fast42 from '@codam/fast42';
import { Event42, Exam42 } from './interfaces.js';

const campus_id = process.env.INTRA_CAMPUS_ID;

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

export const fetchEvents = async function(api: Fast42): Promise<Event42[]> {
	try {
		const items = await fetchAll42(api, `/campus/${campus_id}/events`, { 'filter[future]': 'true' });
		if (items.length == 0) {
			console.log("No events found");
			return [];
		}

		const events: Event42[] = items.map((item) => {
			return new Event42(item);
		});
		events.sort((a, b) => {
			return a.begin_at.getTime() - b.begin_at.getTime();
		});
		console.log(`Fetched ${events.length} events`);
		return events;
	}
	catch(err) {
		console.log(err);
		return [];
	}
};

export const fetchExams = async function(api: Fast42): Promise<Exam42[]> {
	try {
		const items = await fetchAll42(api, `/campus/${campus_id}/exams`, { 'filter[future]': 'true' });
		if (items.length == 0) {
			console.log("No exams found");
			return [];
		}

		const exams: Exam42[] = items.map((item) => {
			return new Exam42(item);
		});
		exams.sort((a, b) => {
			return a.begin_at.getTime() - b.begin_at.getTime();
		});
		console.log(`Fetched ${exams.length} exams`);
		return exams;
	}
	catch(err) {
		console.log(err);
		return [];
	}
};
