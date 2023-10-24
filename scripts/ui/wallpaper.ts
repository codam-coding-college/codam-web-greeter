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
		const wallpaper: Wallpaper = (this._isLockScreen ? window.data.lockScreenWallpaper : window.data.loginScreenWallpaper);

		if (wallpaper.exists) {
			// Set wallpaper (yes for some reason the file path just works without file://)
			// Actually, file:// will even cause the image to not load.
			this._element.style.backgroundImage = 'url("' + wallpaper.path + '")';
		}

		return true;
	}
}
