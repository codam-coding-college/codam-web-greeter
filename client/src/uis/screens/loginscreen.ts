import { Authenticator, AuthenticatorEvents } from "../../auth";
import { UILoginElements, UIScreen } from "../screen";

export class LoginScreenUI extends UIScreen {
	public readonly _form: UILoginElements;
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

	public constructor(auth: Authenticator) {
		super(auth);

		this._form = {
			form: document.getElementById('login-form') as HTMLFormElement,
			loginInput: document.getElementById('login') as HTMLInputElement,
			passwordInput: document.getElementById('password') as HTMLInputElement,
			loginButton: document.getElementById('login-button') as HTMLButtonElement,
		} as UILoginElements;

		this._initForm();
	}

	protected _initForm(): void {
		const form = this._form as UILoginElements;

		// This event gets called when the user clicks the login button or submits the login form in any other way
		(this._form as UILoginElements).form.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this._auth.login(form.loginInput.value, form.passwordInput.value);
		});

		// Only enable the login button when both the login and password fields are filled in
		form.loginInput.addEventListener('input', () => {
			this._enableOrDisableSubmitButton();
		});
		form.passwordInput.addEventListener('input', () => {
			this._enableOrDisableSubmitButton();
		});
	}

	// Returns true if the login button is disabled, false otherwise
	protected _enableOrDisableSubmitButton(): boolean {
		const form = this._form as UILoginElements;
		const buttonDisabled = form.loginInput.value.trim() === "" || form.passwordInput.value === "";
		form.loginButton.disabled = buttonDisabled;
		return buttonDisabled;
	}

	protected _wigglePasswordInput(clearInput: boolean = true): void {
		const passwordInput = (this._form as UILoginElements).passwordInput;
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
		const form = this._form as UILoginElements;
		if (form.loginInput.value.trim() === "") {
			return form.loginInput;
		}
		return form.passwordInput;
	}
}
