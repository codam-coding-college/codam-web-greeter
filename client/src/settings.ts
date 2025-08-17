const PATH_SETTINGS_JSON: string = 'settings.json';

export class Settings {
	private _exam_username: string = "exam";
	/**
	 * The username used by the greeter to log in to an exam session.
	 * @default "exam"
	 */
	public get examUsername(): string {
		return this._exam_username;
	}

	private _exam_password: string = "exam";
	/**
	 * The password used by the greeter to log in to an exam session.
	 * @default "exam"
	 */
	public get examPassword(): string {
		return this._exam_password;
	}

	private _exam_mode_disabled: boolean = false;
	/**
	 * If true, the greeter will not enter exam mode, even if there are ongoing exams.
	 * The student will have to log in to the exam manually.
	 * @default false
	 */
	public get examModeDisabled(): boolean {
		return this._exam_mode_disabled;
	}

	private _exam_mode_check_interval: number = 5;
	/**
	 * The interval in seconds at which the greeter checks if it should go into exam mode.
	 * @default 5
	 */
	public get examModeCheckInterval(): number {
		return this._exam_mode_check_interval;
	}

	private _exam_mode_minutes_before_begin: number = 20;
	/**
	 * The number of minutes before the exam begins that the greeter should enter exam mode.
	 * @default 20
	 */
	public get examModeMinutesBeforeBegin(): number {
		return this._exam_mode_minutes_before_begin;
	}

	public constructor() {

	}

	public readSettingsFile(): Promise<void> {
		return new Promise((resolve, reject) => {
			// Using XMLHttpRequest to fetch settings.json instead of fetch API
			// because while nody-greeter supports fetch, web-greeter does not.
			// It would error with "URL scheme 'web-greeter' is not supported"
			const req = new XMLHttpRequest();
			req.addEventListener('load', () => {
				try {
					const data: any = JSON.parse(req.responseText);
					console.log("Fetched settings.json", data);
					for (const key in data) {
						if (data.hasOwnProperty(key)) {
							(this as any)[`_${key}`] = data[key];
						}
					}
				} catch (err) {
					window.ui.setDebugInfo(`Failed to parse settings.json: ${err}`);
				}
			});
			req.addEventListener('error', (err) => {
				if (window.ui) {
					window.ui.setDebugInfo(`Error fetching settings.json: ${err}`);
				}
			});
			req.open('GET', PATH_SETTINGS_JSON);
			req.send();
		});

	}
}
