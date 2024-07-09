import { GreeterImage } from "../data";

export class WallpaperUI {
	private _element: HTMLElement;
	private _blurFilter: HTMLElement;

	public constructor(isLockScreen: boolean, wallpaperElement: HTMLElement | null = null) {
		this._element = wallpaperElement ?? document.body;
		this._blurFilter = document.getElementById('blur-filter') as HTMLElement;

		this.displayWallpaper();
	}

	public displayWallpaper(): boolean {
		let wallpaper: GreeterImage = window.data.loginScreenWallpaper;
		if (window.ui.isLockScreen) {
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
			// Fall back to black color
			this._element.style.backgroundColor = 'black';
			this._element.style.backgroundImage = 'none';
		}

		return true;
	}
}
