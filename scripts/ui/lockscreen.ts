import { Authenticator } from "../auth";
import { LightDMUser } from "nody-greeter-types";
import { UIScreen, UILockScreenElements } from "./screen";

export class LockScreenUI extends UIScreen {
	public readonly _form: UILockScreenElements;
	private readonly _activeSession: LightDMUser;

	public constructor(auth: Authenticator, activeSession: LightDMUser) {
		super(auth, {
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
		});

		this._activeSession = activeSession;
		this._form = {
			lockForm: document.getElementById('lock-form') as HTMLFormElement,
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
		form.displayName.innerText = this._activeSession.display_name ?? this._activeSession.username;
		form.loginName.innerText = this._activeSession.username;

		// This event gets called when the user clicks the unlock button or submits the lock screen form in any other way
		form.lockForm.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this._auth.login(this._activeSession.username, form.passwordInput.value);
		});

		// Only enable the login button when both the login and password fields are filled in
		form.passwordInput.addEventListener('input', () => {
			this._enableOrDisableSubmitButton();
		});

		// Display the lock screen form
		form.lockForm.style.display = "block";
		form.passwordInput.focus();
	}

	protected _disableForm(): void {
		for (const element of Object.values(this._form as UILockScreenElements)) {
			if ("disabled" in element && typeof element.disabled === "boolean") { // check if element has disabled property and disable every element that has it
				element.disabled = true;
			}
		}

		// Unfocus the focused element
		if (document.activeElement) {
			(document.activeElement as HTMLElement).blur();
		}
	}

	protected _enableForm(focusElement: HTMLInputElement | null = null): void {
		for (const element of Object.values(this._form as UILockScreenElements)) {
			if ("disabled" in element && typeof element.disabled === "boolean") { // check if element has disabled property and enable every element that has it
				element.disabled = false;
			}
		}

		this._enableOrDisableSubmitButton();

		if (!focusElement) {
			focusElement = this._getInputToFocusOn();
		}
		focusElement.focus();
	}

	// Returns true if the login button is disabled, false otherwise
	protected _enableOrDisableSubmitButton(): boolean {
		const form = this._form as UILockScreenElements;
		const buttonDisabled = form.passwordInput.value === "";
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
