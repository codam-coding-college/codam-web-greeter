import { GreeterImage } from "../data";

export class WallpaperUI {
	private _element: HTMLElement;
	private _blurFilter: HTMLElement;
	private _isLockScreen: boolean;

	public constructor(isLockScreen: boolean, wallpaperElement: HTMLElement | null = null) {
		this._element = wallpaperElement ?? document.body;
		this._blurFilter = document.getElementById('blur-filter') as HTMLElement;
		this._isLockScreen = isLockScreen;

		this.displayWallpaper();
	}

	public displayWallpaper(): boolean {
		let wallpaper: GreeterImage = window.data.loginScreenWallpaper;
		if (this._isLockScreen) {
			this._blurFilter.style.display = 'block';
			if (window.data.userLockScreenWallpaper.exists) {
				wallpaper = window.data.userLockScreenWallpaper;
			}
		}

		if (wallpaper.exists) {
			// Set wallpaper (yes for some reason the file path just works without file://)
			// Actually, file:// will even cause the image to not load.
			this._element.style.backgroundImage = 'url("' + wallpaper.path + '")';
		}
		else {
			// Fall back to default image from CSS vars
			this._element.style.backgroundImage = window.getComputedStyle(this._element).getPropertyValue('--default-bg-img');
		}

		return true;
	}
}
