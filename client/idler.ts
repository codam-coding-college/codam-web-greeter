import { ScreensaverUI } from "./uis/screensaver";

export class Idler {
	private _idle: boolean = false;
	private _lastActivity: number = Date.now();
	private _idleAfter: number = 300000; // 5 minutes
	private _isLockScreen: boolean;
	private _screensaverUI: ScreensaverUI;

	public constructor(isLockScreen: boolean = false) {
		this._isLockScreen = isLockScreen;
		this._screensaverUI = new ScreensaverUI(isLockScreen);

		// Listen for keyboard and mouse events
		window.addEventListener("keydown", this._stopIdling.bind(this));
		window.addEventListener("mousemove", this._stopIdling.bind(this));
		window.addEventListener("mousedown", this._stopIdling.bind(this));

		// Check for idle at a regular interval
		setInterval(this._checkIdle.bind(this), 1000);
	}

	public get idleAfter(): number {
		return this._idleAfter;
	}

	public get idle(): boolean {
		return this._idle;
	}

	private _startIdling(): void {
		this._idle = true;
		this._screensaverUI.start();
	}

	private _stopIdling(): void {
		this._lastActivity = Date.now();
		if (this._idle) {
			this._screensaverUI.stop();
			this._idle = false;
		}
	}

	private _checkIdle(): boolean {
		if (this._idle) {
			return true;
		}

		// Check if we're idle
		if (Date.now() - this._lastActivity >= this._idleAfter) {
			this._startIdling();
			return true;
		}
		return false;
	}
}
