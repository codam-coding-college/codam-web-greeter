import { parseIpRanges } from "./utils";

export class Event42 {
	id: number;
	name: string;
	description: string;
	location: string;
	kind: string;
	max_people: number;
	nbr_subscriptions: number;
	begin_at: Date;
	end_at: Date;
	campus_ids: number[];
	cursus_ids: number[];
	created_at: Date;
	updated_at: Date;

	constructor(data: any) {
		this.id = data['id'];
		this.name = data['name'];
		this.description = data['description'];
		this.location = data['location'];
		this.kind = data['kind'];
		this.max_people = data['max_people'];
		this.nbr_subscriptions = data['nbr_subscriptions'];
		this.begin_at = new Date(data['begin_at']);
		this.end_at = new Date(data['end_at']);
		this.campus_ids = data['campus_ids'];
		this.cursus_ids = data['cursus_ids'];
		this.created_at = new Date(data['created_at']);
		this.updated_at = new Date(data['updated_at']);
	}
}

export class Cursus42 {
	id: number;
	name: string;
	slug: string;

	constructor(data: any) {
		this.id = data['id'];
		this.name = data['name'];
		this.slug = data['slug'];
	}
}

export class Project42 {
	id: number;
	name: string;
	slug: string;

	constructor(data: any) {
		this.id = data['id'];
		this.name = data['name'];
		this.slug = data['slug'];
	}
}

export class Exam42 {
	id: number;
	ip_range: string[];
	begin_at: Date;
	end_at: Date;
	location: string;
	max_people: number;
	nbr_subscribers: number;
	name: string;
	created_at: Date;
	updated_at: Date;
	cursus: Cursus42[] = [];
	projects: Project42[] = [];

	constructor(data: any) {
		this.id = data['id'];
		this.ip_range = parseIpRanges(data['ip_range']);
		this.begin_at = new Date(data['begin_at']);
		this.end_at = new Date(data['end_at']);
		this.location = data['location'];
		this.max_people = data['max_people'];
		this.nbr_subscribers = data['nbr_subscribers'];
		this.name = data['name'];
		this.created_at = new Date(data['created_at']);
		this.updated_at = new Date(data['updated_at']);
		if (data['cursus'].length > 0) {
			this.cursus = data['cursus'].map((cursus: any) => {
				return new Cursus42(cursus);
			});
			// Remove duplicates
			this.cursus = this.cursus.filter((cursus, index, self) =>
				index === self.findIndex((c) => (
					c.id === cursus.id
				))
			);
		}
		if (data['projects'].length > 0) {
			this.projects = data['projects'].map((project: any) => {
				return new Project42(project);
			});
		}
	}
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
