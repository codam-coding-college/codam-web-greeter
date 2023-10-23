import { Authenticator, AuthenticatorEvents } from "../auth";
import { UILockScreenElements } from "./lockscreen";
import { UILoginElements } from "./loginscreen";

export declare class Screen {
	protected _auth: Authenticator;
	protected _form: UILockScreenElements | UILoginElements;
	protected _events: AuthenticatorEvents;

	public constructor();

	protected _initForm(): void;
	protected _disableForm(): void;
	protected _enableForm(): void;
	protected _wigglePasswordInput(): void;
	protected _getInputToFocusOn(): HTMLInputElement;
}
