import packageJSON from '../package.json';
import { lightdm } from 'nody-greeter-types/index'


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


export class Data {
	public pkgName: string;
	public pkgVersion: string;
	public hostname: string;
	public loginScreenWallpaper: Wallpaper;
	public lockScreenWallpaper: Wallpaper;

	constructor() {
		// Get version from package.json
		this.pkgName = packageJSON.name;
		this.pkgVersion = packageJSON.version;

		// Get hostname from LightDM
		this.hostname = lightdm.hostname;

		// Set up the wallpapers
		this.loginScreenWallpaper = new Wallpaper('/usr/share/codam/wallpapers/login-screen.jpg');
		this.lockScreenWallpaper = new Wallpaper('/usr/share/codam/wallpapers/ft_lock_bkg.jpg')
	}
}
