import { LightDMMessageType, LightDMPromptType, LightDMUser, lightdm } from 'nody-greeter-types/index';

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

export class Authenticator {
	private _loginElements: UILoginElements;
	private _lockScreenElements: UILockScreenElements;

	private _authenticating: boolean = false;
	private _authenticated: boolean = false;
	private _username: string = "";
	private _password: string = "";
	private _session: string = "ubuntu"; // always start with ubuntu.desktop X11 session

	private _isLockScreen: boolean = false;
	private _activeSession: LightDMUser | undefined;

	public constructor() {
		this._loginElements = {
			loginForm: document.getElementById('login-form') as HTMLFormElement,
			loginInput: document.getElementById('login') as HTMLInputElement,
			passwordInput: document.getElementById('password') as HTMLInputElement,
			loginButton: document.getElementById('login-button') as HTMLButtonElement,
		};

		this._lockScreenElements = {
			lockForm: document.getElementById('lock-form') as HTMLFormElement,
			displayName: document.getElementById('active-user-session-display-name') as HTMLHeadingElement,
			loginName: document.getElementById('active-user-session-login-name') as HTMLHeadingElement,
			passwordInput: document.getElementById('active-user-session-password') as HTMLInputElement,
			unlockButton: document.getElementById('unlock-button') as HTMLButtonElement,
		};

		// Check for any active sessions
		this._activeSession = lightdm.users.find((user: LightDMUser) => user.logged_in);

		if (this._activeSession !== undefined) {
			// Active session found, show lock screen form
			this._isLockScreen = true;
			this._username = this._activeSession.username;
			this._initLockScreenForm();
		}
		else {
			// No active session found, show login form
			this._initLoginForm();
		}

		// Initialize LightDM event listeners
		this._initLightDMListeners();
	}

	private _initLoginForm(): void {
		// This event gets called when the user clicks the login button or submits the login form in any other way
		this._loginElements.loginForm.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this._username = this._loginElements.loginInput.value.trim();
			this._password = this._loginElements.passwordInput.value.trim();
			this._login();
		});

		// Display the login form
		this._loginElements.loginForm.style.display = "block";
		this._loginElements.loginInput.focus();
	}

	private _initLockScreenForm(): void {
		// Populate lock screen data
		this._lockScreenElements.displayName.innerText = this._activeSession?.display_name ?? this._activeSession?.username ?? "User";
		this._lockScreenElements.loginName.innerText = this._activeSession?.username ?? "user";

		// This event gets called when the user clicks the unlock button or submits the lock screen form in any other way
		this._lockScreenElements.lockForm.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this._password = this._lockScreenElements.passwordInput.value.trim();
			this._login();
		});

		// Display the lock screen form
		this._lockScreenElements.lockForm.style.display = "block";
		this._lockScreenElements.passwordInput.focus();
	}

	private _initLightDMListeners(): void {
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
				this._authenticating = false;
				console.log("LightDM authentication complete. Checking results...");
				if (lightdm.is_authenticated) {
					this._authenticated = true;
					console.log("LightDM authentication successful! Starting session...");
					lightdm.start_session(this._session ?? null);
				}
				else {
					console.log("LightDM authentication failed. User not found or password incorrect.");
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
		if (!this._isLockScreen) {
			this._username = "";
		}
		this._password = "";
	}

	private _disableForm(): void {
		const uiElementsObject = this._isLockScreen ? this._lockScreenElements : this._loginElements;
		for (const element of Object.values(uiElementsObject)) {
			if ("disabled" in element && typeof element.disabled === "boolean") { // check if element has disabled property and disable every element that has it
				element.disabled = true;
			}
		}

		// Unfocus the focused element
		if (document.activeElement) {
			(document.activeElement as HTMLElement).blur();
		}
	}

	private _enableForm(focusElement: HTMLInputElement | null = null): void {
		const uiElementsObject = this._isLockScreen ? this._lockScreenElements : this._loginElements;
		for (const element of Object.values(uiElementsObject)) {
			if ("disabled" in element && typeof element.disabled === "boolean") { // check if element has disabled property and enable every element that has it
				element.disabled = false;
			}
		}

		if (!focusElement) {
			focusElement = this._getInputToFocusOn();
		}
		focusElement.focus();
	}

	private _wigglePasswordInput(clearInput: boolean = true): void {
		const passwordInput = this._isLockScreen ? this._lockScreenElements.passwordInput : this._loginElements.passwordInput;
		passwordInput.classList.add('wiggle');
		setTimeout(() => {
			passwordInput.classList.remove('wiggle');
		}, 800); // overdo the animation a bit to make sure it's finished before we remove the class

		if (clearInput) {
			passwordInput.value = "";
			passwordInput.focus();
		}
	}

	private _getInputToFocusOn(): HTMLInputElement {
		if (this._isLockScreen) {
			return this._lockScreenElements.passwordInput;
		}
		else {
			if (this._loginElements.loginInput.value.trim() === "") {
				return this._loginElements.loginInput;
			}
			return this._loginElements.passwordInput;
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
				console.log("Username or password is empty. Stopping authentication.");
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
