import { Data } from "../data";
import { Wallpaper } from "../data";
import fs from 'fs';

export class WallpaperUI {
	private _element: HTMLElement;
	private _isLockScreen: boolean;

	public constructor(isLockScreen: boolean, wallpaperElement: HTMLElement | null = null) {
		this._element = wallpaperElement ?? document.body;
		this._isLockScreen = isLockScreen;

		this.displayWallpaper();
	}

	public displayWallpaper(): boolean {
		const wallpaper: Wallpaper = (this._isLockScreen ? window.data.lockScreenWallpaper : window.data.loginScreenWallpaper);

		if (wallpaper.exists) {
			// Read wallpaper file
			fs.readFile(wallpaper.path, (err, data) => {
				if (err) {
					console.error(err);
					return false;
				}

				// Set wallpaper by creating a blob URL
				const blob = new Blob([data], { type: 'image/jpeg' });
				const url = URL.createObjectURL(blob);
				this._element.style.backgroundImage = 'url(' + url + ')';
			});
		}

		return true;
	}
}
