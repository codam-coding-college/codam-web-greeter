import { Authenticator, AuthenticatorEvents } from "../../auth";
import { LightDMUser } from "nody-greeter-types";
import { UIScreen, UILockScreenElements } from "../screen";
import { UI } from "../../ui";

export class LockScreenUI extends UIScreen {
	public readonly _form: UILockScreenElements;
	private readonly _activeSession: LightDMUser;
	private _isExamMode: boolean = false;
	private _lockedTime: Date = new Date();
	protected _events: AuthenticatorEvents = {
		authenticationStart: () => {
			this._disableForm();
		},
		authenticationComplete: () => {
			// TODO: Add a loading animation here
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
			calendar: document.getElementById('intra-calendar') as HTMLDivElement,
		} as UILockScreenElements;

		this._initForm();
	}

	protected _initForm(): void {
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
			form.calendar.style.display = "none";
			this._enableOrDisableSubmitButton();
		}
		else {
			form.avatar.addEventListener('error', () => {
				console.warn(`Failed to load avatar for user ${this._activeSession.username}`);
				form.avatar.src = "assets/default-user.png"; // Load fallback image
			});
			if (window.data.userImage.exists) {
				// Show the user's avatar from the /tmp folder
				form.avatar.src = window.data.userImage.path;
			}
			else if (this._activeSession.image) {
				// This image always fails to load due to permissions issues
				// The greeter does not have access to the user's home folder...
				form.avatar.src = this._activeSession.image;
			}
			else if (window.data.userDefaultImage.exists) {
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

	private _lockedTimer(): void {
		const logoutAfter = 42; // minutes
		const lockedMinutesAgo = (Date.now() - this._lockedTime.getTime()) / 1000 / 60;
		const timeRemaining = logoutAfter - lockedMinutesAgo;
		if (timeRemaining <= 0.25) {
			this._disableForm();
			this._form.lockedTimeAgo.innerText = "Automated logout in progress...";
			if (timeRemaining < -5) {
				// Add debug text indicating the systemd service might have failed or was not installed
				window.ui.setDebugInfo("Automated logout appears to take a while. Is the systemd idling service from codam-web-greeter installed and enabled?");
			}
		}
		else {
			const flooredTime = Math.floor(timeRemaining);
			this._form.lockedTimeAgo.innerText = "Automated logout occurs in " + flooredTime.toString() + " minute" + (flooredTime === 1 ? "" : "s");
		}
	}
}
