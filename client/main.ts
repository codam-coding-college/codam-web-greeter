// Import local classes
import { Data } from './data';
import { UI } from './ui';
import { Authenticator } from './auth';
import { Idler } from './idler';

declare global {
	interface Window {
		data: Data;
		auth: Authenticator;
		ui: UI;
		idler: Idler;

		sleep(ms: number): Promise<void>;
		restartComputer(): boolean;
	}
}

// use with await window.sleep(1000); to sleep for 1 second
async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
window.sleep = sleep;

// use with window.restartComputer(); to restart the computer
window.restartComputer = () => {
	try {
		if (!window.lightdm?.can_restart) {
			window.ui.setDebugInfo("Rebooting failed: lightdm.can_restart is false");
			return false;
		}

		window.lightdm?.restart();
		return true;
	}
	catch (err) {
		window.ui.setDebugInfo(`Rebooting failed: ${err}`);
		return false;
	}
};

async function initGreeter(): Promise<void> {
	// Initialize local classes
	window.data = new Data();
	window.auth = new Authenticator();
	window.ui = new UI(window.data, window.auth);
	window.idler = new Idler(window.ui.isLockScreen);

	// Add reboot keybind to reboot on ctrl+alt+del
	// only when the lock screen is not shown
	document.addEventListener('keydown', (e) => {
		// Ctrl + Alt + Delete = reboot computer
		if (e.ctrlKey && e.altKey && e.code === 'Delete' && !window.ui.isLockScreen) {
			window.ui.setDebugInfo('Reboot requested through LightDM');
			window.restartComputer();
		}
		// Ctrl + Alt + E = override exam mode
		if (e.ctrlKey && e.altKey && e.code === 'KeyE' && !window.ui.isLockScreen) {
			window.ui.setDebugInfo('Exam mode override enabled');
			window.ui.overrideExamMode();
		}
	});
}

window.addEventListener("GreeterReady", () => {
	initGreeter();
});
