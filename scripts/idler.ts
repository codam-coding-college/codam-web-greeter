export class Idler {
	private _idle: boolean = false;
	private _lastActivity: number = Date.now();
	private _idleAfter: number = 300000; // 5 minutes
	private _takeActionAfter: number = 2520000; // 42 minutes
	private _isLockScreen: boolean;

	public constructor(isLockScreen: boolean = false) {
		this._isLockScreen = isLockScreen;

		// Listen for keyboard and mouse events
		window.addEventListener("keydown", this._unidle.bind(this));
		window.addEventListener("mousemove", this._unidle.bind(this));
		window.addEventListener("mousedown", this._unidle.bind(this));

		// Check for idle at a regular interval
		setInterval(this._checkIdle.bind(this), 1000);
	}

	public get idleAfter(): number {
		return this._idleAfter;
	}

	public get idle(): boolean {
		return this._idle;
	}

	private _unidle(): void {
		this._lastActivity = Date.now();
		this._idle = false;
	}

	private _action(): void {
		// TODO: start screensaver?
	}

	private _checkIfActionNeeded(): boolean {
		if (this._idle) {
			// Check if we should take action
			if (Date.now() - this._lastActivity >= this._takeActionAfter) {
				this._action();
				return true;
			}
		}
		return false;
	}

	private _checkIdle(): boolean {
		if (this._idle) {
			this._checkIfActionNeeded();
			return true;
		}

		// Check if we're idle
		if (Date.now() - this._lastActivity >= this._idleAfter) {
			this._idle = true;
			console.log("Now idling...");
			this._checkIfActionNeeded(); // Needed if idleAfter and takeActionAfter share the same value
			return true;
		}
		return false;
	}
}
