import { BlankScreensaver } from "./screensavers/blank";

export class ScreensaverUI {
	private _canvasWrapper: HTMLElement;
	private _canvas: HTMLCanvasElement;
	private _isRunning: boolean = false;
	private _screensaver = new BlankScreensaver();
	private _isLockScreen: boolean;

	public constructor(isLockScreen: boolean = false) {
		this._isLockScreen = isLockScreen;
		this._canvasWrapper = document.getElementById('screensaver-wrapper') as HTMLElement;
		this._canvas = document.getElementById('screensaver-canvas') as HTMLCanvasElement;
	}

	/**
	 * Draw 1 frame of the currently selected screensaver.
	 */
	private _draw(): void {
		if (!this._isRunning) {
			return;
		}

		const ctx = this._canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		this._screensaver.draw(ctx, this._canvas.width, this._canvas.height);

		if (this._isRunning && this._screensaver.getName() !== 'Blank') {
			requestAnimationFrame(this._draw.bind(this));
		}
	};

	/**
	 * Start running the screensaver.
	 */
	public start(): void {
		this._isRunning = true;
		this._canvasWrapper.classList.add('active');
		this._canvas.width = window.innerWidth;
		this._canvas.height = window.innerHeight;
		this._draw();
	};

	/**
	 * Stop running the screensaver.
	 */
	public stop(): void {
		this._isRunning = false;
		this._canvasWrapper.classList.remove('active');
	};
}
