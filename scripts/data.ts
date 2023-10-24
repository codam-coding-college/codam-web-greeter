import packageJSON from '../package.json';
import { lightdm } from 'nody-greeter-types/index'
import fs from 'fs';


export class Wallpaper {
	private _path: string;
	private _exists: boolean;
	private _fileType: string;

	public constructor(path: string) {
		this._path = path;
		this._exists = fs.existsSync(this._path);
		this._fileType = 'image/' + this._path.split('.').pop() ?? 'jpeg';
		if (this._fileType === 'image/jpg') this._fileType = 'image/jpeg';
		if (!this._exists) {
			console.warn('Wallpaper file at ' + this._path + ' does not exist!');
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
