import { LightDMMessageType, LightDMPromptType, lightdm } from 'nody-greeter-types/index';

export interface UILoginElements {
	loginForm: HTMLFormElement;
	loginInput: HTMLInputElement;
	passwordInput: HTMLInputElement;
	loginButton: HTMLButtonElement;
}

export class Authenticator {
	private _loginElements: UILoginElements;

	private _authenticating: boolean = false;
	private _authenticated: boolean = false;
	private _username: string = "";
	private _password: string = "";
	private _session: string = "ubuntu"; // always start with ubuntu.desktop X11 session

	public constructor() {
		this._loginElements = {
			loginForm: document.getElementById('login-form') as HTMLFormElement,
			loginInput: document.getElementById('login') as HTMLInputElement,
			passwordInput: document.getElementById('password') as HTMLInputElement,
			loginButton: document.getElementById('login-button') as HTMLButtonElement,
		};

		// This event gets called when the user clicks the login button or submits the form in any other way
		this._loginElements.loginForm.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this._username = this._loginElements.loginInput.value.trim();
			this._password = this._loginElements.passwordInput.value.trim();
			this._login();
		});

		// This event gets called when LightDM asks for more authentication data
		lightdm.show_prompt.connect((message: string, type: LightDMPromptType) => {
			try {
				switch (type) {
					case LightDMPromptType.Question: // Login (this should never happen as the username was provided by lightdm.authenticate before)
						console.log("LightDM requested username, responding...");
						lightdm.respond(this._username);
						break;
					case LightDMPromptType.Secret: // Password
						console.log("LightDM requested password, responding...");
						lightdm.respond(this._password);
						break;
					default:
						console.error(`Unknown lightDM prompt type: ${type}`);
						break;
				}
			}
			catch (err) {
				console.error(err);
			}
		});

		// This event gets called when LightDM wants to display a message in the greeter
		lightdm.show_message.connect((message: string, type: LightDMMessageType) => {
			try {
				switch (type) {
					case LightDMMessageType.Info:
						console.log(`LightDM info message: ${message}`);
						break;
					case LightDMMessageType.Error:
						console.error(`LightDM error message: ${message}`);
						break;
					default:
						console.warn(`Unknown lightDM message type: ${type}, message: ${message}`);
						break;
				}
			}
			catch (err) {
				console.error(err);
			}
		});

		// This event gets called when LightDM says the authentication was successful and a session should be started
		lightdm.authentication_complete.connect(() => {
			try {
				console.log("LightDM authentication complete");
				this._authenticating = false;
				if (lightdm.is_authenticated) {
					console.log("LightDM authentication successful! Starting session...");
					this._authenticated = true;
					lightdm.start_session(this._session ?? null);
				}
				else {
					console.log("LightDM authentication failed!");
					this._stopAuthentication();
					this._wigglePasswordInput();
				}
			}
			catch (err) {
				console.error(err);
			}
		});
	}

	private _clearAuth(): void {
		this._username = "";
		this._password = "";
	}

	private _disableForm(): void {
		this._loginElements.loginInput.disabled = true;
		this._loginElements.passwordInput.disabled = true;
		this._loginElements.loginButton.disabled = true;

		// Blur the focused element
		if (document.activeElement) {
			(document.activeElement as HTMLElement).blur();
		}
	}

	private _enableForm(): void {
		this._loginElements.loginInput.disabled = false;
		this._loginElements.passwordInput.disabled = false;
		this._loginElements.loginButton.disabled = false;
		this._loginElements.loginInput.focus();
	}

	private _wigglePasswordInput(clearInput: boolean = true): void {
		this._loginElements.passwordInput.classList.add('wiggle');
		setTimeout(() => {
			this._loginElements.passwordInput.classList.remove('wiggle');
		}, 800); // overdo the animation a bit to make sure it's finished before we remove the class

		if (clearInput) {
			this._loginElements.passwordInput.value = "";
			this._loginElements.passwordInput.focus();
		}
	}

	private _stopAuthentication(): void {
		lightdm.cancel_authentication();
		this._authenticating = false;
		this._authenticated = false;
		this._clearAuth();
		this._enableForm();
	}

	private _startAuthentication(): void {
		try {
			console.log("Starting LightDM authentication...");
			lightdm.cancel_authentication();
			if (this._username === "" || this._password === "") {
				return this._stopAuthentication();
			}
			this._authenticating = true;
			lightdm.authenticate(this._username); // provide username to skip the username prompt
		}
		catch (err) {
			console.error(err);
		}
	}

	private _login(): void {
		if (this._authenticating || this._authenticated) {
			return;
		}

		this._disableForm();
		this._startAuthentication();
	}
}
