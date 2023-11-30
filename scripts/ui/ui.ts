import { Authenticator } from "../auth";
import { Data, ExamForHost, DataJson } from "../data";
import { InfoBarsUI } from "./infobars";
import { LockScreenUI } from "./lockscreen";
import { LoginScreenUI } from "./loginscreen";
import { LightDMUser, lightdm } from "nody-greeter-types";
import { WallpaperUI } from "./wallpaper"
import { CalendarUI } from "./calendar";
import { ExamModeUI } from "./examscreen";

export class UI {
	public static readonly EXAM_MODE_CHECK_INTERVAL: number = 5 * 1000; // 5 seconds
	public static readonly SHOW_EXAM_MODE_MINUTES_BEFORE_BEGIN: number = 20; // 20 minutes

	private _infoBars: InfoBarsUI;
	private _lockScreen: LockScreenUI | null = null;
	private _loginScreen: LoginScreenUI | null = null;
	private _examModeScreen: ExamModeUI | null = null;
	private _isLockScreen: boolean = false;
	private _wallpaper: WallpaperUI;
	private _calendar: CalendarUI;

	public constructor(data: Data, auth: Authenticator) {
		this._infoBars = new InfoBarsUI();

		// Check for active sessions
		const activeSession = lightdm.users.find((user: LightDMUser) => user.logged_in);

		if (activeSession !== undefined) {
			// Active session found, show lock screen form
			this._lockScreen = new LockScreenUI(auth, activeSession);
			this._isLockScreen = true;
			this._lockScreen.showForm();
		}
		else {
			// No active session found, show login form or exam mode form
			this._loginScreen = new LoginScreenUI(auth);
			this._examModeScreen = new ExamModeUI(auth, this._loginScreen, null);

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

		this._wallpaper = new WallpaperUI(this._isLockScreen);
		this._calendar = new CalendarUI(data);
	}

	public get isLockScreen(): boolean {
		return this._isLockScreen;
	}

	public setDebugInfo(info: string): void {
		this._infoBars.setDebugInfo(info);
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

		const examsForHost: ExamForHost[] = window.data.dataJson.exams_for_host;
		const ongoingExam = examsForHost.find((exam) => {
			const now = new Date();
			const beginAt = new Date(exam.begin_at);
			const beginExamModeAt = new Date(beginAt.getTime() - UI.SHOW_EXAM_MODE_MINUTES_BEFORE_BEGIN * 60 * 1000);
			const endAt = new Date(exam.end_at);
			return now >= beginExamModeAt && now < endAt;
		});

		const examModeExam = this._examModeScreen?.exam;
		if (ongoingExam !== undefined) {
			if (examModeExam === null || examModeExam?.id !== ongoingExam.id) { // Only set exam mode again if the exam has changed or was not set before
				console.log("Activating exam mode login UI");
				this._examModeScreen?.setExam(ongoingExam);
				// Exam mode screen is shown automatically by the function above
			}
			return true;
		}
		else {
			if (examModeExam !== null) { // Only unset exam mode if it was set before
				console.log('Deactivating exam mode login UI');
				this._examModeScreen?.setExam(null);
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
}
