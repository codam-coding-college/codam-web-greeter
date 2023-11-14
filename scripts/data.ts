import packageJSON from '../package.json';
import { lightdm } from 'nody-greeter-types/index'


const PATH_DATA_JSON: string = '/usr/share/codam/data.json';
const PATH_WALLPAPER_LOGIN: string = '/usr/share/codam/wallpapers/login-screen.jpg';
const PATH_WALLPAPER_LOCK: string = '/usr/share/codam/wallpapers/ft_lock_bkg.jpg';

export class Wallpaper {
	private _path: string;
	private _exists: boolean;

	public constructor(path: string) {
		this._path = path;

		// Check if file exists
		const dir = this._path.split('/').slice(0, -1).join('/');
		const dirFiles = window.theme_utils?.dirlist_sync(dir, false);
		this._exists = (dirFiles !== undefined && dirFiles.includes(this._path));
		if (!this._exists) {
			console.warn('Wallpaper file does not exist: ' + this._path);
		}
	}

	public get path(): string {
		return this._path;
	}

	public get exists(): boolean {
		return this._exists;
	}
}


export interface Event42 {
	id: number;
	name: string;
	description: string;
	location: string;
	kind: string;
	max_people: number | null;
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
	location: string;
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
	session: {
		username: string;
		password: string;
	}
}

export interface DataJson {
	hostname: string;
	events: Event42[];
	exams: Exam42[];
	exams_for_host: ExamForHost[];
	fetch_time: string;
}


export class Data {
	public pkgName: string;
	public pkgVersion: string;
	public hostname: string;
	public loginScreenWallpaper: Wallpaper;
	public lockScreenWallpaper: Wallpaper;
	private _dataJson: DataJson | undefined;
	private _dataChangeListeners: ((dataJson: DataJson) => void)[] = [];

	constructor() {
		// Get version from package.json
		this.pkgName = packageJSON.name;
		this.pkgVersion = packageJSON.version;

		// Get hostname from LightDM
		this.hostname = lightdm.hostname;

		// Set up the wallpapers
		this.loginScreenWallpaper = new Wallpaper(PATH_WALLPAPER_LOGIN);
		this.lockScreenWallpaper = new Wallpaper(PATH_WALLPAPER_LOCK);

		// Fetch data.json
		this._refetchDataJson();
	}

	public addDataChangeListener(listener: (dataJson: DataJson) => void): void {
		this._dataChangeListeners.push(listener);
	}

	public removeDataChangeListener(listener: (dataJson: DataJson) => void): void {
		this._dataChangeListeners = this._dataChangeListeners.filter(l => l !== listener);
	}

	private _refetchDataJson(): void {
		fetch(PATH_DATA_JSON)
			.then(response => response.json())
			.then(data => {
				console.log("Fetched data.json", data);
				this._dataJson = data;
				// Emit data change event to all listeners
				for (const listener of this._dataChangeListeners) {
					listener(data);
				}
			});
	}
}
