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
			for (const child of this._form.footer.children) {
				try {
					(child as HTMLElement).style.display = "none";
				}
				catch (err) {
					// whatever man
				}
			}

			// Play the welcome sound
			try {
				const audio = new Audio('assets/welcome.mp3');
				audio.play();
			}
			catch (err) {
				console.log('Failed to play welcome sound:', err);
			}
		}
	}

	public constructor(auth: Authenticator) {
		super(auth);
		this._form = {
			form: document.getElementById('welcome-form') as HTMLFormElement,
			footer: document.getElementById('footer') as HTMLDivElement,
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
