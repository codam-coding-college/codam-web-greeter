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
	const maxFetchDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24 * 365); // 1 year into the future
	return `${currentDate.toISOString()},${maxFetchDate.toISOString()}`;
};

const filterExamOrEventOnDate = function(items: Exam42[] | Event42[]) {
	// Delete events that are over the limit specified in the global variable
	const currentDate = new Date();
	const maxFetchDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24 * FETCH_EVENTS_UPCOMING_DAYS);
	// @ts-ignore (This expression is not callable -> each member of union type has signatures, but none of those signatures are compatible with each other)
	const filteredItems = items.filter((item: Exam42 | Event42) => {
		const eventDate = new Date(item.begin_at);
		return eventDate.getTime() <= maxFetchDate.getTime();
	});
	return filteredItems;
}


export const fetchEvents = async function(api: Fast42): Promise<Event42[]> {
	try {
		const range = getEventDateRange();
		const intraEvents = await fetchAll42(api, `/campus/${CAMPUS_ID}/events`, { 'range[end_at]': range, 'filter[kind]': EVENT_KINDS_FILTER.join(',') });

		// Convert to Event42 objects
		const events42: Event42[] = intraEvents.map((item) => {
			return new Event42(item);
		});

		// Remove events too far into the future
		const filteredEvents = filterExamOrEventOnDate(events42) as Event42[];

		if (filteredEvents.length == 0) {
			console.log("No events found");
			return [];
		}

		filteredEvents.sort((a, b) => {
			return a.begin_at.getTime() - b.begin_at.getTime();
		});
		console.log(`Fetched ${filteredEvents.length} events`);
		return filteredEvents;
	}
	catch(err) {
		console.log(err);
		return [];
	}
};

export const fetchExams = async function(api: Fast42): Promise<Exam42[]> {
	try {
		const range = getEventDateRange();
		const intraExams = await fetchAll42(api, `/campus/${CAMPUS_ID}/exams`, { 'range[end_at]': range, 'filter[visible]': 'true' });

		// Convert to Exam42 objects
		const exams42: Exam42[] = intraExams.map((item) => {
			return new Exam42(item);
		});

		// Remove exams too far into the future
		const filteredExams = filterExamOrEventOnDate(exams42) as Exam42[];

		if (filteredExams.length == 0) {
			console.log("No exams found");
			return [];
		}

		filteredExams.sort((a, b) => {
			return a.begin_at.getTime() - b.begin_at.getTime();
		});
		console.log(`Fetched ${filteredExams.length} exams`);
		return filteredExams;
	}
	catch(err) {
		console.log(err);
		return [];
	}
};

export const fetchUserImage = async function(api: Fast42, login: string): Promise<string> {
	try {
		const req = await api.get(`/users/`, {
			'filter[login]': login, // Filtering instead of querying for the specific user is faster
		});
		if (req.status == 429) {
			throw new Error('Intra API rate limit exceeded');
		}
		if (req.ok) {
			const data = await req.json();
			if (data.length == 0) {
				throw new Error('User not found on Intra');
			}
			const user = data[0];
			if (user.image) {
				if (user.image.versions && user.image.versions.large) {
					return user.image.versions.large;
				}
				else {
					return user.image.link; // This one should always exist
				}
			}
			else {
				throw new Error('User has no image set on Intra');
			}
		}
		else {
			throw new Error(`Intra API error: ${req.status} ${req.statusText}`);
		}
	}
	catch (err) {
		console.log(`Failed fetching user image for ${login}: ${err}`);
		return '';
	}
}
