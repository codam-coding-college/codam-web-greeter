import { Authenticator } from "../auth";
import { InfoBarsUI } from "./infobars";
import { LockScreenUI } from "./lockscreen";
import { LoginScreenUI } from "./loginscreen";
import { LightDMUser, lightdm } from "nody-greeter-types";

export class UI {
	private _infoBars: InfoBarsUI;
	private _lockScreen: LockScreenUI | null = null;
	private _loginScreen: LoginScreenUI | null = null;
	private _isLockScreen: boolean = false;

	public constructor(auth: Authenticator) {
		this._infoBars = new InfoBarsUI();

		// Check for active sessions
		const activeSession = lightdm.users.find((user: LightDMUser) => user.logged_in);

		if (activeSession !== undefined) {
			// Active session found, show lock screen form
			this._lockScreen = new LockScreenUI(auth, activeSession);
			this._isLockScreen = true;
		}
		else {
			// No active session found, show login form
			this._loginScreen = new LoginScreenUI(auth);
		}
	}

	public get isLockScreen(): boolean {
		return this._isLockScreen;
	}
}
