import { Authenticator, AuthenticatorEvents } from "../../auth";
import { LightDMUser } from "nody-greeter-types";
import { UIScreen, UILockScreenElements } from "../screen";
import { UI } from "../../ui";

export class LockScreenUI extends UIScreen {
	public readonly _form: UILockScreenElements;
	private readonly _activeSession: LightDMUser;
	private _isExamMode: boolean = false;
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
			displayName: document.getElementById('active-user-session-display-name') as HTMLHeadingElement,
			loginName: document.getElementById('active-user-session-login-name') as HTMLHeadingElement,
			passwordInput: document.getElementById('active-user-session-password') as HTMLInputElement,
			unlockButton: document.getElementById('unlock-button') as HTMLButtonElement,
		} as UILockScreenElements;

		this._initForm();
	}

	protected _initForm(): void {
		const form = this._form as UILockScreenElements;

		// Populate lock screen data
		if (this._activeSession.username === "exam") {
			// The exam user is a special case, we don't want to show the password input field. Just use the default password "exam"
			this._isExamMode = true;
			form.displayName.innerText = "Exam in progress";
			form.loginName.innerText = "Click the arrow below to resume your exam.";
			form.loginName.style.marginTop = UI.getPadding(); // Add some padding for readability
			form.passwordInput.value = "exam";
			form.passwordInput.style.display = "none";
			this._enableOrDisableSubmitButton();
		}
		else {
			form.displayName.innerText = this._activeSession.display_name ?? this._activeSession.username;
			form.loginName.innerText = this._activeSession.username;
		}

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
}
