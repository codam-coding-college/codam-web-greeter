import { Authenticator, AuthenticatorEvents } from "../auth";

export interface UILoginElements {
	form: HTMLFormElement;
	loginInput: HTMLInputElement;
	passwordInput: HTMLInputElement;
	loginButton: HTMLButtonElement;
}

export interface UILockScreenElements {
	form: HTMLFormElement;
	displayName: HTMLHeadingElement;
	loginName: HTMLHeadingElement;
	passwordInput: HTMLInputElement;
	unlockButton: HTMLButtonElement;
}

export interface UIExamModeElements {
	form: HTMLFormElement;
	examProjectsText: HTMLSpanElement;
	examStartButton: HTMLButtonElement;
}

export abstract class UIScreen {
	protected _auth: Authenticator;
	abstract _form: UILockScreenElements | UILoginElements | UIExamModeElements;
	private _events: AuthenticatorEvents;
	private _formShown: boolean = false;

	public constructor(auth: Authenticator, events: AuthenticatorEvents) {
		this._auth = auth;
		this._events = events;
		this._auth.authEvents = this._events;
	};

	/**
	 * Show this screen's form / UI.
	 * Does nothing if the form is already shown.
	 */
	public showForm(): void {
		if (!this._formShown) {
			this._formShown = true;
			this._form.form.style.display = "block";
			this._getInputToFocusOn().focus();
		}
	}

	/**
	 * Hide this screen's form / UI.
	 * Does nothing if the form is already hidden.
	 */
	public hideForm(): void {
		if (this._formShown) {
			this._formShown = false;
			this._form.form.style.display = "none";
		}
	}

	/**
	 * Returns true if this screen's form / UI is shown, false otherwise.
	 */
	public get formShown(): boolean {
		return this._formShown;
	}

	protected abstract _initForm(): void;
	protected abstract _wigglePasswordInput(): void;
	protected abstract _getInputToFocusOn(): HTMLInputElement | HTMLButtonElement;
	protected abstract _enableOrDisableSubmitButton(): boolean;

	/**
	 * Disable all elements in this screen's form / UI that can be disabled. Unfocuses the focused element.
	 */
	protected _disableForm(): void {
		for (const element of Object.values(this._form)) {
			if ("disabled" in element && typeof element.disabled === "boolean") { // check if element has disabled property and disable every element that has it
				element.disabled = true;
			}
		}

		// Unfocus the focused element
		if (document.activeElement) {
			(document.activeElement as HTMLElement).blur();
		}
	}

	/**
	 * Enable all elements in this screen's form / UI that can be disabled. Focuses the specified element.
	 * @param focusElement The element to focus after enabling the form. If null, no element will be focused.
	 */
	protected _enableForm(focusElement: HTMLInputElement | null = null): void {
		for (const element of Object.values(this._form)) {
			if ("disabled" in element && typeof element.disabled === "boolean") { // check if element has disabled property and enable every element that has it
				element.disabled = false;
			}
		}

		// Focus the specified element
		if (focusElement !== null) {
			focusElement.focus();
		}
	}

	public set authEvents(events: AuthenticatorEvents) {
		this._events = events;
		this._auth.authEvents = this._events;
	}
}
