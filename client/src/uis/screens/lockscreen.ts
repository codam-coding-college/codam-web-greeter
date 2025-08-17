import { Authenticator, AuthenticatorEvents } from "../../auth";
import { LightDMUser, ThemeUtils } from "nody-greeter-types";
import { UIScreen, UILockScreenElements } from "../screen";
import { UI } from "../../ui";

const PATH_LOCK_TIMESTAMP_PREFIX = '/tmp/codam_web_greeter_lock_timestamp';

export class LockScreenUI extends UIScreen {
	public readonly _form: UILockScreenElements;
	private readonly _activeSession: LightDMUser;
	private _isExamMode: boolean = false;
	private _lockedTime: Date | null = null;
	protected _events: AuthenticatorEvents = {
		authenticationStart: () => {
			this._disableForm();
		},
		authenticationComplete: async () => {
			// TODO: Add a loading animation here
			return true;
		},
		authenticationFailure: () => {
			this._enableForm();
			this._wigglePasswordInput();
		},
		errorMessage: (message: string) => {
			alert(message);
			window.ui.setDebugInfo(message);
		},
		infoMessage: (message: string) => {
			alert(message);
		},
	};

	public constructor(auth: Authenticator, activeSession: LightDMUser) {
		super(auth);

		this._activeSession = activeSession;
		this._form = {
			form: document.getElementById('lock-form') as HTMLFormElement,
			avatar: document.getElementById('active-user-session-avatar') as HTMLImageElement,
			displayName: document.getElementById('active-user-session-display-name') as HTMLHeadingElement,
			loginName: document.getElementById('active-user-session-login-name') as HTMLHeadingElement,
			lockedTimeAgo: document.getElementById('active-user-session-locked-ago') as HTMLSpanElement,
			passwordInput: document.getElementById('active-user-session-password') as HTMLInputElement,
			unlockButton: document.getElementById('unlock-button') as HTMLButtonElement,
		} as UILockScreenElements;

		this._initForm();

		// Check when the screen was locked every minute (delete the lock_timestamp file in /tmp to prevent the automated logout)
		setInterval(this._getAndSetLockedTimestamp.bind(this), 60000);
		this._getAndSetLockedTimestamp();
	}

	protected async _initForm(): Promise<void> {
		const form = this._form as UILockScreenElements;

		// Populate lock screen data
		if (this._activeSession.username === "exam") {
			// The exam user is a special case, we don't want to show the password input field. Just use the default password "exam"
			this._isExamMode = true;
			form.avatar.style.display = "none";
			form.displayName.innerText = "Exam in progress";
			form.loginName.innerText = "Click the arrow below to resume your exam.";
			form.loginName.style.marginTop = UI.getPadding(); // Add some padding for readability
			form.passwordInput.value = "exam";
			form.passwordInput.style.display = "none";
			this._enableOrDisableSubmitButton();
		}
		else {
			form.avatar.addEventListener('error', () => {
				form.avatar.src = "assets/default-user.png"; // Load fallback image
			});
			if (await window.data.userImage.exists) {
				// Show the user's avatar from the /tmp folder
				form.avatar.src = window.data.userImage.path;
			}
			else if (this._activeSession.image) {
				// This image always fails to load due to permissions issues
				// The greeter does not have access to the user's home folder...
				form.avatar.src = this._activeSession.image;
			}
			else if (await window.data.userDefaultImage.exists) {
				form.avatar.src = window.data.userDefaultImage.path;
			}
			form.displayName.innerText = this._activeSession.display_name ?? this._activeSession.username;
			form.loginName.innerText = this._activeSession.username;
		}

		// Update the time remaining timer every 10 seconds
		setInterval(this._lockedTimer.bind(this), 10000);

		// This event gets called when the user clicks the unlock button or submits the lock screen form in any other way
		form.form.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this._auth.login(this._activeSession.username, form.passwordInput.value);
		});

		// Only enable the login button when both the login and password fields are filled in
		form.passwordInput.addEventListener('input', () => {
			this._enableOrDisableSubmitButton();
		});
	}

	// Returns true if the login button is disabled, false otherwise
	protected _enableOrDisableSubmitButton(): boolean {
		const form = this._form as UILockScreenElements;
		const buttonDisabled = form.passwordInput.value === "" && this._isExamMode === false; // Always enable in exam mode
		form.unlockButton.disabled = buttonDisabled;
		return buttonDisabled;
	}

	protected _wigglePasswordInput(clearInput: boolean = true): void {
		const passwordInput = (this._form as UILockScreenElements).passwordInput;
		passwordInput.classList.add('wiggle');
		passwordInput.addEventListener('keydown', () => {
			passwordInput.classList.remove('wiggle');
		}, { once: true });

		if (clearInput) {
			passwordInput.value = "";
			passwordInput.focus();
			this._enableOrDisableSubmitButton();
		}
	}

	protected _getInputToFocusOn(): HTMLInputElement {
		return (this._form as UILockScreenElements).passwordInput;
	}

	public get lockedTime(): Date | null {
		return this._lockedTime;
	}

	private _getScreenLockedTimestamp(login: string): Promise<Date> {
		// Using XMLHttpRequest to fetch data.json instead of fetch API
		// because while nody-greeter supports fetch, web-greeter does not.
		// It would error with "URL scheme 'web-greeter' is not supported"
		return new Promise((resolve, reject) => {
			const req = new XMLHttpRequest();
			req.addEventListener('load', () => {
				try {
					const timestamp = req.responseText.split(' ')[0];
					if (timestamp) {
						resolve(new Date(parseInt(timestamp) * 1000));
					} else {
						reject(new Error("No timestamp found in response"));
					}
				} catch (err) {
					reject(err);
				}
			});
			req.addEventListener('error', (err) => {
				reject(err);
			});
			req.open('GET', `${PATH_LOCK_TIMESTAMP_PREFIX}_${login}`);
			req.send();
		});
	}

	private _getAndSetLockedTimestamp(): void {
		this._getScreenLockedTimestamp(this._activeSession.username)
			.then((timestamp: Date) => {
				this._lockedTime = timestamp;
				this._lockedTimer(); // run once immediately, after this the interval will take care of updating the timer
			})
			.catch(() => {
				// Unable to get the screen locked timestamp, prevent automated logout by setting the locked time to null
				this._lockedTime = null;
			});
	}

	private _lockedTimer(): void {
		if (!this._lockedTime) {
			// Unsure when the screen was locked, no automated logout possible
			return;
		}

		const logoutAfter = 42; // minutes
		const lockedMinutesAgo = (Date.now() - this._lockedTime.getTime()) / 1000 / 60;
		const timeRemaining = logoutAfter - lockedMinutesAgo;
		if (timeRemaining <= 0.25) {
			this._disableForm();
			this._form.lockedTimeAgo.innerText = "Automated logout in progress...";
			if (timeRemaining < -5) { // Give it a 5 minute grace period
				// Add debug text indicating the systemd service might have failed or was not installed
				window.ui.setDebugInfo("Automated logout appears to take a while. Is the systemd idling service from codam-web-greeter installed and enabled?");
				this._enableForm(); // Allow the user to just unlock the screen again
			}
		}
		else {
			const flooredTime = Math.floor(timeRemaining);
			this._form.lockedTimeAgo.innerText = "Automated logout occurs in " + flooredTime.toString() + " minute" + (flooredTime === 1 ? "" : "s");
		}
	}
}
