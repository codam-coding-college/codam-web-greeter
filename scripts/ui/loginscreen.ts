import { Authenticator } from "../auth";
import { UILoginElements, UIScreen } from "./screen";

export class LoginScreenUI extends UIScreen {
	public readonly _form: UILoginElements;

	public constructor(auth: Authenticator) {
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
			},
			infoMessage: (message: string) => {
				alert(message);
			},
		});

		this._form = {
			loginForm: document.getElementById('login-form') as HTMLFormElement,
			loginInput: document.getElementById('login') as HTMLInputElement,
			passwordInput: document.getElementById('password') as HTMLInputElement,
			loginButton: document.getElementById('login-button') as HTMLButtonElement,
		} as UILoginElements;

		this._initForm();
	}

	protected _initForm(): void {
		const form = this._form as UILoginElements;

		// This event gets called when the user clicks the login button or submits the login form in any other way
		(this._form as UILoginElements).loginForm.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this._auth.login(form.loginInput.value, form.passwordInput.value);
		});

		// Display the login form
		form.loginForm.style.display = "block";
		form.loginInput.focus();
	}

	protected _disableForm(): void {
		for (const element of Object.values(this._form as UILoginElements)) {
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
		for (const element of Object.values(this._form as UILoginElements)) {
			if ("disabled" in element && typeof element.disabled === "boolean") { // check if element has disabled property and enable every element that has it
				element.disabled = false;
			}
		}

		if (!focusElement) {
			focusElement = this._getInputToFocusOn();
		}
		focusElement.focus();
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
