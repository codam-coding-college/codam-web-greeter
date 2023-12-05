import { Wallpaper } from "../data";

export class WallpaperUI {
	private _element: HTMLElement;
	private _isLockScreen: boolean;

	public constructor(isLockScreen: boolean, wallpaperElement: HTMLElement | null = null) {
		this._element = wallpaperElement ?? document.body;
		this._isLockScreen = isLockScreen;

		this.displayWallpaper();
	}

	public displayWallpaper(): boolean {
		let wallpaper: Wallpaper = window.data.loginScreenWallpaper;
		if (this._isLockScreen) {
			if (window.data.userLockScreenWallpaper.exists) {
				wallpaper = window.data.userLockScreenWallpaper;
			}
			else {
				wallpaper = window.data.lockScreenWallpaper;
			}
		}

		if (wallpaper.exists) {
			// Set wallpaper (yes for some reason the file path just works without file://)
			// Actually, file:// will even cause the image to not load.
			this._element.style.backgroundImage = 'url("' + wallpaper.path + '")';
		}
		else {
			// Fall back to black color
			this._element.style.backgroundColor = 'black';
			this._element.style.backgroundImage = 'none';
		}

		return true;
	}
}
