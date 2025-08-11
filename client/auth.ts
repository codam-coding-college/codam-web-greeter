import { LightDMMessageType, LightDMPromptType, lightdm } from 'nody-greeter-types/index';

export interface AuthenticatorEvents {
	/**
	 * This event gets called when the login process starts without error.
	 */
	authenticationStart: () => void;

	/**
	 * This event gets called when the login process completes without error.
	 * The event handler must return a Promise that resolves to a boolean value.
	 * When this value is true, the user session will be started.
	 * Otherwise, the user will be returned to the greeter.
	 * This allows for custom handling of the authentication result or adding another form on top.
	 * The AuthenticationFailure event is not called afterwards, so update the UI accordingly if
	 * false is returned.
	 */
	authenticationComplete: () => Promise<boolean>;

	/**
	 * This event gets called when the login process fails due to an authentication failure (wrong username or password).
	 */
	authenticationFailure: () => void;

	/**
	 * This event gets called when LightDM wants to display an error message or when an error occurs in the Authenticator class.
	 * @param message The error message.
	 */
	errorMessage: (message: string) => void;

	/**
	 * This event gets called when LightDM wants to display an info message.
	 * @param message The info message.
	 */
	infoMessage: (message: string) => void;
}

export class Authenticator {
	private _authenticating: boolean = false;
	private _authenticated: boolean = false;

	private _authEvents: AuthenticatorEvents | null = null;

	private _username: string = "";
	private _password: string = "";
	private _session: string = "ubuntu"; // always start with ubuntu.desktop X11 session

	public static readonly MAX_LEN_USERNAME = 32;
	public static readonly MAX_LEN_PASSWORD = 128;

	public constructor() {
		// Initialize LightDM event listeners
		this._initLightDMListeners();
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
						window.ui.setDebugInfo(`Unknown lightDM prompt type: ${type}`);
						break;
				}
			}
			catch (err) {
				window.ui.setDebugInfo(String(err));
				if (this._authEvents) {
					this._authEvents.errorMessage(String(err));
				}
			}
		});

		// This event gets called when LightDM wants to display a message in the greeter
		lightdm.show_message.connect((message: string, type: LightDMMessageType) => {
			try {
				switch (type) {
					case LightDMMessageType.Info:
						console.log(`LightDM info message: ${message}`);
						if (this._authEvents) {
							this._authEvents.infoMessage(message);
						}
						break;
					case LightDMMessageType.Error:
						window.ui.setDebugInfo(`LightDM error message: ${message}`);
						if (this._authEvents) {
							this._authEvents.errorMessage(message);
						}
						break;
					default:
						window.ui.setDebugInfo(`Unknown lightDM message type: ${type}, message: ${message}`);
						break;
				}
			}
			catch (err) {
				window.ui.setDebugInfo(String(err));
				if (this._authEvents) {
					this._authEvents.errorMessage(String(err));
				}
			}
		});

		// This event gets called when LightDM says the authentication was successful and a session should be started
		lightdm.authentication_complete.connect(async () => {
			try {
				console.log("LightDM authentication complete. Checking results...");
				if (!lightdm.is_authenticated) {
					this._authenticating = false;
					console.log("LightDM authentication failed. User not found or password incorrect.");
					this._stopAuthentication();
					if (this._authEvents) {
						this._authEvents.authenticationFailure();
					}
					return;
				}
				this._authenticated = true;
				this._authenticating = false;
				console.log("LightDM authentication successful! Starting session...");
				const eventResult = (this._authEvents) ? await this._authEvents.authenticationComplete() : Promise.resolve(true);
				if (eventResult) {
					lightdm.start_session(this._session ?? null);
				}
				else {
					this._stopAuthentication();
				}
			}
			catch (err) {
				this._authenticating = false;
				window.ui.setDebugInfo(String(err));
				if (this._authEvents) {
					this._authEvents.errorMessage(String(err));
				}
			}
		});
	}

	/**
	 * Check if the authentication process has started.
	 * @returns True if the authentication process has started, false otherwise.
	 */
	public get authenticating(): boolean {
		return this._authenticating;
	}

	/**
	 * Check if the authentication process has completed.
	 * @returns True if the authentication process has completed, false otherwise.
	 */
	public get authenticated(): boolean {
		return this._authenticated;
	}

	/**
	 * Get the username that is currently being authenticated.
	 * @returns The username that is currently being authenticated.
	 */
	public get username(): string {
		return this._username;
	}

	/**
	 * Configure the callback functions that are called on certain events.
	 * @param authEvents The callback functions that are called on certain events.
	 * @returns void
	 */
	public set authEvents(authEvents: AuthenticatorEvents | null) {
		this._authEvents = authEvents;
	}

	private _clearAuth(): void {
		this._username = "";
		this._password = "";
	}

	private _stopAuthentication(): void {
		lightdm.cancel_authentication();
		this._authenticating = false;
		this._authenticated = false;
		this._clearAuth();
	}

	private _startAuthentication(): void {
		try {
			console.log("Starting LightDM authentication...");
			lightdm.cancel_authentication();
			this._authenticating = true;
			lightdm.authenticate(this._username); // provide username to skip the username prompt
		}
		catch (err) {
			window.ui.setDebugInfo(String(err));
			if (this._authEvents) {
				this._authEvents.errorMessage(String(err));
			}
		}
	}

	/**
	 * Start the login process. The authenticationStart auth event will be called when the login process starts without error.
	 * @param username The username to log in with.
	 * @param password The password to log in with.
	 * @returns void
	 */
	public login(username: string, password: string): void {
		this._username = username.substring(0, Authenticator.MAX_LEN_USERNAME).trim();
		this._password = password.substring(0, Authenticator.MAX_LEN_PASSWORD); // do not trim password as it could contain spaces at the beginning or end

		if (this._authenticating || this._authenticated) {
			window.ui.setDebugInfo("login() was called while already authenticating or authenticated");
			return;
		}

		if (this._username === "" || this._password === "") {
			window.ui.setDebugInfo("login() was called while username or password is empty");
			return;
		}

		if (this._authEvents) {
			this._authEvents.authenticationStart();
		}
		this._startAuthentication();
	}
}
