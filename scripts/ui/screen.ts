import { Authenticator, AuthenticatorEvents } from "../auth";

export interface UILoginElements {
	loginForm: HTMLFormElement;
	loginInput: HTMLInputElement;
	passwordInput: HTMLInputElement;
	loginButton: HTMLButtonElement;
}

export interface UILockScreenElements {
	lockForm: HTMLFormElement;
	displayName: HTMLHeadingElement;
	loginName: HTMLHeadingElement;
	passwordInput: HTMLInputElement;
	unlockButton: HTMLButtonElement;
}

export abstract class UIScreen {
	protected _auth: Authenticator;
	abstract _form: UILockScreenElements | UILoginElements;
	private _events: AuthenticatorEvents;

	public constructor(auth: Authenticator, events: AuthenticatorEvents) {
		this._auth = auth;
		this._events = events;
		this._auth.authEvents = this._events;
	};

	protected abstract _initForm(): void;
	protected abstract _disableForm(): void;
	protected abstract _enableForm(): void;
	protected abstract _wigglePasswordInput(): void;
	protected abstract _getInputToFocusOn(): HTMLInputElement;
	protected abstract _enableOrDisableSubmitButton(): boolean;

	public set authEvents(events: AuthenticatorEvents) {
		this._events = events;
		this._auth.authEvents = this._events;
	}
}
