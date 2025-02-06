import { Authenticator, AuthenticatorEvents } from "../auth";

export interface UILoginElements {
	form: HTMLFormElement;
	loginInput: HTMLInputElement;
	passwordInput: HTMLInputElement;
	loginButton: HTMLButtonElement;
}

export interface UILockScreenElements {
	form: HTMLFormElement;
	avatar: HTMLImageElement;
	displayName: HTMLHeadingElement;
	loginName: HTMLHeadingElement;
	lockedTimeAgo: HTMLSpanElement;
	passwordInput: HTMLInputElement;
	unlockButton: HTMLButtonElement;
}

export interface UIExamModeElements {
	form: HTMLFormElement;
	examProjectsText: HTMLSpanElement;
	examStartText: HTMLSpanElement;
	examEndText: HTMLSpanElement;
	examStartButton: HTMLButtonElement;
}

export abstract class UIScreen {
	protected _auth: Authenticator;
	abstract _form: UILockScreenElements | UILoginElements | UIExamModeElements;
	protected abstract _events: AuthenticatorEvents;
	protected _formShown: boolean = false;

	public constructor(auth: Authenticator) {
		this._auth = auth;
	};

	/**
	 * Connect the events of this screen's form / UI to the authenticator.
	 */
	protected _connectEvents(): void {
		this._auth.authEvents = this._events;
	}

	/**
	 * Disconnect the events of this screen's form / UI from the authenticator.
	 */
	protected _disconnectEvents(): void {
		this._auth.authEvents = null;
	}

	/**
	 * Show this screen's form / UI and connects its events to the authenticator.
	 * Does nothing if the form is already shown.
	 * WARNING: Make sure to call hideForm() on another currently shown form (if there is one) before calling this method,
	 * otherwise the form will be hidden but the events will still be connected.
	 */
	public showForm(): void {
		if (!this._formShown) {
			this._formShown = true;
			this._form.form.style.display = "block";
			const inputToFocusOn = this._getInputToFocusOn();
			if (inputToFocusOn !== null) {
				inputToFocusOn.focus();
			}
			this._connectEvents();
		}
	}

	/**
	 * Hide this screen's form / UI and disconnects its events from the authenticator.
	 * Does nothing if the form is already hidden.
	 */
	public hideForm(): void {
		if (this._formShown) {
			this._formShown = false;
			this._form.form.style.display = "none";
			this._disconnectEvents();
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
	protected abstract _getInputToFocusOn(): HTMLInputElement | HTMLButtonElement | null;
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
}
