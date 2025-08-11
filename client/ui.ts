import { Authenticator } from "./auth";
import { Data, ExamForHost, DataJson } from "./data";
import { InfoBarsUI } from "./uis/infobars";
import { LockScreenUI } from "./uis/screens/lockscreen";
import { LoginScreenUI } from "./uis/screens/loginscreen";
import { LightDMUser, lightdm } from "nody-greeter-types";
import { WallpaperUI } from "./uis/wallpaper"
import { CalendarUI } from "./uis/calendar";
import { ExamModeUI } from "./uis/screens/examscreen";

export class UI {
	public static readonly EXAM_MODE_CHECK_INTERVAL: number = 5 * 1000; // 5 seconds
	public static readonly SHOW_EXAM_MODE_MINUTES_BEFORE_BEGIN: number = 20; // 20 minutes

	private _infoBars: InfoBarsUI;
	private _lockScreen: LockScreenUI | null = null;
	private _loginScreen: LoginScreenUI | null = null;
	private _examModeScreen: ExamModeUI | null = null;
	private _isLockScreen: boolean = false;
	private _examModeDisabled: boolean = false; // Used to disable exam mode in case of admin override
	private _wallpaper: WallpaperUI;
	private _calendar: CalendarUI;
	private _logo: HTMLImageElement;
	private _message: HTMLElement;
	private _scalingFactor: number = 1;

	public constructor(data: Data, auth: Authenticator) {
		this._infoBars = new InfoBarsUI();
		this._logo = document.getElementById('logo') as HTMLImageElement;
		this._message = document.getElementById('message') as HTMLElement;

		// Set up DPI scaling
		this.applyHiDpiScaling();

		// Set up logo
		this._logo.src = data.logo.path;
		this._logo.addEventListener('error', () => {
			console.log(`Logo image not found at ${data.logo.path}`);
		});

		// Check for active sessions
		const activeSession = lightdm.users.find((user: LightDMUser) => user.logged_in);

		if (activeSession !== undefined) {
			// Active session found, show lock screen form
			this._lockScreen = new LockScreenUI(auth, activeSession);
			this._isLockScreen = true;
			this._logo.style.display = 'none';
			this._lockScreen.showForm();
		}
		else {
			// No active session found, show login form or exam mode form
			this._loginScreen = new LoginScreenUI(auth);
			this._examModeScreen = new ExamModeUI(auth, this._loginScreen);

			// Subscribe to data change events, so that we can show the exam mode screen when an exam is started
			data.addDataChangeListener((data: DataJson | undefined) => {
				this.checkForExamMode();
			});
			// Check for exam mode at a regular interval
			setInterval(() => {
				this.checkForExamMode();
			}, UI.EXAM_MODE_CHECK_INTERVAL);
			this.checkForExamMode(); // Check for exam mode right now
		}

		// Register message change listener
		data.addDataChangeListener((data: DataJson | undefined) => {
			if (data !== undefined) {
				this.setMessage(data.message);
			}
		});
		// Set message now
		if (data.dataJson !== undefined) {
			this.setMessage(data.dataJson.message);
		}

		this._wallpaper = new WallpaperUI(this._isLockScreen);
		this._calendar = new CalendarUI(data);
	}

	public get isLockScreen(): boolean {
		return this._isLockScreen;
	}

	/**
	 * Override the exam mode and show the regular login screen. Useful for admins who need to debug.
	 */
	public overrideExamMode(): void {
		this._examModeDisabled = true;
		this.checkForExamMode();
	}

	public setDebugInfo(info: string): void {
		console.log("Debug info:", info);
		this._infoBars.setDebugInfo(info);
	}

	public setMessage(message: string): void {
		// Remove any HTML tags from the message
		message = message.replace(/(<([^>]+)>)/gi, "");
		// Replace newlines with <br> tags
		message = message.replace(/\n/g, '<br>');
		// Parse *bold* and _italic_ text
		message = message.replace(/\*(.*?)\*/g, '<b>$1</b>');
		message = message.replace(/_(.*?)_/g, '<i>$1</i>');
		// Replace multiple spaces with non-breaking spaces
		message = message.replace(/  +/g, '&nbsp;&nbsp;');

		this._message.innerHTML = message;
	}

	public getMessage(): string {
		return this._message.innerText;
	}

	/**
	 * Check if there is an ongoing exam or an exam starting soon and show the exam mode screen if this is the case.
	 * Otherwise, the regular login screen will be shown.
	 * @returns true if the exam mode screen is shown, false otherwise.
	 */
	public checkForExamMode(): boolean {
		if (this.isLockScreen) { // Don't show exam mode on the lock screen
			return false;
		}

		if (window.data.dataJson === undefined) { // If no data is available, show the regular login screen
			this._examModeScreen?.hideForm();
			this._loginScreen?.showForm();
			return false;
		}

		// Get exams that are starting soon
		const examsForHost: ExamForHost[] = window.data.dataJson.exams_for_host;
		const ongoingExams = examsForHost.filter((exam) => {
			const now = new Date();
			const beginAt = new Date(exam.begin_at);
			const beginExamModeAt = new Date(beginAt.getTime() - UI.SHOW_EXAM_MODE_MINUTES_BEFORE_BEGIN * 60 * 1000);
			const endAt = new Date(exam.end_at);
			return now >= beginExamModeAt && now < endAt;
		});

		if (!this._examModeDisabled && ongoingExams.length > 0) {
			// Only set exam mode if the exam that is starting soon is not already in the list of exam ids displayed in exam mode
			if (!this._examModeScreen?.examMode || !ongoingExams.some((exam) => this._examModeScreen?.examIds.includes(exam.id))) {
				console.log("Activating exam mode login UI");
				this._examModeScreen?.enableExamMode(ongoingExams);
				// Exam mode screen is shown automatically by the function above
			}
			return true;
		}
		else {
			if (this._examModeScreen?.examMode) { // Only unset exam mode if it was set before
				console.log('Deactivating exam mode login UI');
				this._examModeScreen?.disableExamMode();
				// Login screen is shown automatically by the function above
			}
			return false;
		}
	}

	/**
	 * Get the padding specified in the CSS variable --padding.
	 */
	public static getPadding(element: HTMLElement = document.body): string {
		return getComputedStyle(element).getPropertyValue('--padding');
	}

	/**
	 * Set the primary theme color of the greeter.
	 * @arg color The color to set, in a CSS color format. If set to null, the default color will be used.
	 */
	public setPrimaryThemeColor(color: string | null): void {
		const root = document.documentElement;
		if (color === null) {
			root.style.setProperty('--color-primary', 'var(--color-blue)');
		}
		else {
			root.style.setProperty('--color-primary', color);
		}
	}

	/**
	 * Get the current primary theme color of the greeter.
	 */
	public getPrimaryThemeColor(): string {
		return getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
	}

	/**
	 * Get the scaling factor for UI elements
	 */
	public get scalingFactor(): number {
		return this._scalingFactor;
	}

	/**
	 * Apply scaling for HiDPI screens
	 */
	public applyHiDpiScaling(): void {
		if (window.outerWidth > 2560 /* 1440p */ || window.devicePixelRatio != 1) {
			// Set pixel ratio to 1.5 for HiDPI screens or to the specified DPI value
			// 1.5 is the default here since there's a bug in nody-greeter that causes the value to be always 1 (when it should be 1.5 on iMacs)
			const pixelRatio = window.devicePixelRatio > 1 ? window.devicePixelRatio : 1.5;

			// Apply zoom to the whole page
			//@ts-ignore (zoom is a non-standard property)
			document.body.style.zoom = `${pixelRatio}`;

			// Apply zoom to CSS variables for scaling of vw and vh units
			const root = document.documentElement;
			root.style.setProperty('--zoom', `${pixelRatio}`);

			// Set the scaling factor for UI element calculations
			this._scalingFactor = pixelRatio;
		}
	}
}
