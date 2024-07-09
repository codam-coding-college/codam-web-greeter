import { BlankScreensaver } from "./screensavers/blank";

// This class is not instantiated from within the UI class and is instead used by the Idler class.
// This means window.ui is available from within this class.

export class ScreensaverUI {
	private _canvasWrapper: HTMLElement;
	private _canvas: HTMLCanvasElement;
	private _isRunning: boolean = false;
	private _screensaver = new BlankScreensaver();

	public constructor() {
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

		if (window.ui.isExamMode) {
			// If exam mode is active, stop the screensaver and return to the login screen
			return this.stop();
		}

		if (this._isRunning && this._screensaver.getName() !== 'Blank') {
			requestAnimationFrame(this._draw.bind(this));
		}
	};

	public get isRunning(): boolean {
		return this._isRunning;
	}

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
