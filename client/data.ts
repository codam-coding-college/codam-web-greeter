import packageJSON from '../package.json';


const PATH_DATA_JSON: string = 'data.json';
// Could implement window.greeter_config.branding here, but it appears this object is inconsistent in its type definition
const PATH_LOGO: string = '/usr/share/codam/web-greeter/logo.png';
const PATH_WALLPAPER_LOGIN: string = '/usr/share/codam/web-greeter/login-screen.png';
const PATH_WALLPAPER_LOCK_USER: string = '/tmp/codam-web-greeter-user-wallpaper';
const PATH_USER_IMAGE: string = '/tmp/codam-web-greeter-user-avatar';
const PATH_USER_DEFAULT_IMAGE: string = '/usr/share/codam/web-greeter/user.png';

export class GreeterImage {
	private _path: string;
	private _exists: boolean | null = null;

	public constructor(path: string) {
		this._path = path;
	}

	public async exists(): Promise<boolean> {
		if (this._exists !== null) {
			return this._exists;
		}
		const dir = this._path.split('/').slice(0, -1).join('/');
		const self = this;
		return new Promise((resolve) => {
			window.theme_utils?.dirlist(dir, false, (dirFiles: string[] | undefined) => {
				self._exists = dirFiles !== undefined && dirFiles.includes(self._path);
				resolve(self._exists);
			});
		});
	}

	public get path(): string {
		return this._path;
	}
}


export interface Event42 {
	id: number;
	name: string;
	description: string;
	location: string | null;
	kind: string;
	max_people: number | null;
	nbr_subscribers: number;
	begin_at: string;
	end_at: string;
	campus_ids: number[];
	cursus_ids: number[];
	created_at: string;
	updated_at: string;
}

export interface Cursus42 {
	id: number;
	name: string;
	slug: string;
}

export interface Project42 {
	id: number;
	name: string;
	slug: string;
}

export interface Exam42 {
	cursus: Cursus42[];
	projects: Project42[];
	id: number;
	ip_range: string[];
	begin_at: string;
	end_at: string;
	location: string | null;
	max_people: number;
	nbr_subscribers: number;
	name: string;
	created_at: string;
	updated_at: string;
}

export interface ExamForHost {
	id: number;
	name: string;
	begin_at: string;
	end_at: string;
}

export interface DataJson {
	hostname: string;
	events: Event42[];
	exams: Exam42[];
	exams_for_host: ExamForHost[];
	fetch_time: string;
	message: string;
}


export class Data {
	public pkgName: string;
	public pkgVersion: string;
	public hostname: string;
	public loginScreenWallpaper: GreeterImage;
	public userLockScreenWallpaper: GreeterImage;
	public logo: GreeterImage;
	public userImage: GreeterImage;
	public userDefaultImage: GreeterImage;
	private _dataJsonFetchInterval: number = 60 * 1000; // 1 minute
	private _dataJson: DataJson | undefined;
	private _dataChangeListeners: ((dataJson: DataJson | undefined) => void)[] = [];

	constructor() {
		// Get version from package.json
		this.pkgName = packageJSON.name;
		this.pkgVersion = packageJSON.version;

		// Get hostname from LightDM
		this.hostname = window.lightdm?.hostname || 'unknown-hostname';

		// Set up images
		this.loginScreenWallpaper = new GreeterImage(PATH_WALLPAPER_LOGIN);
		this.userLockScreenWallpaper = new GreeterImage(PATH_WALLPAPER_LOCK_USER);
		this.logo = new GreeterImage(PATH_LOGO);
		this.userImage = new GreeterImage(PATH_USER_IMAGE);
		this.userDefaultImage = new GreeterImage(PATH_USER_DEFAULT_IMAGE);

		// Fetch data.json every 5 minutes and fetch it now
		setInterval(() => this._refetchDataJson(), this._dataJsonFetchInterval);
		this._refetchDataJson();
	}

	public static examToEvent(exam: Exam42): Event42 {
		const desc = `For ${exam.projects.map(c => c.name).join(', ')}`;

		return {
			id: exam.id,
			name: exam.name,
			description: desc,
			location: exam.location,
			kind: 'exam',
			max_people: exam.max_people,
			nbr_subscribers: exam.nbr_subscribers,
			begin_at: exam.begin_at,
			end_at: exam.end_at,
			campus_ids: [], // TODO: populate this? Maybe unnecessary though...
			cursus_ids: exam.cursus.map(c => c.id),
			created_at: exam.created_at,
			updated_at: exam.updated_at,
		}
	}

	public addDataChangeListener(listener: (dataJson: DataJson | undefined) => void): void {
		this._dataChangeListeners.push(listener);
	}

	public removeDataChangeListener(listener: (dataJson: DataJson | undefined) => void): void {
		this._dataChangeListeners = this._dataChangeListeners.filter(l => l !== listener);
	}

	public get dataJson(): DataJson | undefined {
		return this._dataJson;
	}

	private _refetchDataJson(): void {
		// Using XMLHttpRequest to fetch data.json instead of fetch API
		// because while nody-greeter supports fetch, web-greeter does not.
		// It would error with "URL scheme 'web-greeter' is not supported"
		const req = new XMLHttpRequest();
		req.addEventListener('load', () => {
			try {
				const data: DataJson = JSON.parse(req.responseText);
				console.log("Fetched data.json", data);
				if ("error" in data) {
					window.ui.setDebugInfo(`data.json response contains an error: ${data.error}`);
					return;
				}
				// Fallback for missing message field in older versions of data.json
				if (!("message" in data)) {
					(data as DataJson).message = "";
				}
				this._dataJson = data;
				// Emit data change event to all listeners
				for (const listener of this._dataChangeListeners) {
					listener(this._dataJson);
				}
			} catch (err) {
				window.ui.setDebugInfo(`Failed to parse data.json: ${err}`);
			}
		});
		req.addEventListener('error', (err) => {
			if (window.ui) {
				window.ui.setDebugInfo(`Error fetching data.json: ${err}`);
			}
		});
		req.open('GET', PATH_DATA_JSON);
		req.send();
	}
}
