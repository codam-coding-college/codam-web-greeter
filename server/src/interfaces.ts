export interface Event42 {
	id: number;
	name: string;
	description: string;
	location: string;
	kind: string;
	max_people: number;
	nbr_subscriptions: number;
	begin_at: string;
	end_at: string;
	campus_ids: number[];
	cursus_ids: number[];
	created_at: string;
	updated_at: string;
}

export interface Cursus42 {
	id: number;
	created_at: string;
	name: string;
	slug: string;
}

export interface Project42 {
	id: number;
	name: string;
	slug: string;
	created_at: string;
	updated_at: string;
}

export interface Exam42 {
	id: number;
	ip_range: string;
	begin_at: string;
	end_at: string;
	location: string;
	max_people: number;
	nbr_subscribers: number;
	name: string;
	created_at: string;
	updated_at: string;
	cursus: Cursus42[];
	projects: Project42[];
}

export interface ExamForHost {
	name: string;
	start: string;
	end: string;
	session: {
		username: string;
		password: string;
	};
}

export interface Config {
	hostname: string;
	events: Event42[];
	exams: ExamForHost[];
}
