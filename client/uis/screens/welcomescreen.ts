import { Authenticator, AuthenticatorEvents } from "../../auth";
import { UIScreen, UIWelcomeElements } from "../screen";

export class WelcomeScreenUI extends UIScreen {
	public readonly _form: UIWelcomeElements;
	protected _events: AuthenticatorEvents = {
		authenticationStart: () => {

		},
		authenticationComplete: async () => {

		},
		authenticationFailure: () => {

		},
		errorMessage: (message: string) => {

		},
		infoMessage: (message: string) => {

		},
	};


	// Override the showForm method to show the exam mode form since display:block break the layout
	public showForm(): void {
		if (!this._formShown) {
			this._formShown = true;
			this._form.form.style.removeProperty("display");
		}
	}

	public constructor(auth: Authenticator) {
		super(auth);
		this._form = {
			form: document.getElementById('welcome-form') as HTMLFormElement,
		};
	}

	protected _initForm(): void {

	}

	protected _enableOrDisableSubmitButton(): boolean {
		return false;
	}

	protected _getInputToFocusOn(): HTMLInputElement | null {
		return null;
	}

	protected _wigglePasswordInput(): void {

	}
}
