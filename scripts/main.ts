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
	}
}

// use with await window.sleep(1000); to sleep for 1 second
async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
window.sleep = sleep;

async function initGreeter(): Promise<void> {
	// Initialize local classes
	window.data = new Data();
	window.auth = new Authenticator();
	window.ui = new UI(window.data, window.auth);
	window.idler = new Idler(window.ui.isLockScreen);

	// Add reboot keybind to reboot on ctrl+alt+del
	// only when the lock screen is not shown
	document.addEventListener('keydown', (e) => {
		if (e.ctrlKey && e.altKey && e.code === 'Delete' && !window.ui.isLockScreen) {
			try {
				window.lightdm?.restart();
			}
			catch (err) {
				window.ui.setDebugInfo(`Rebooting failed: ${err}`);
			}
		}
	});
}

window.addEventListener("GreeterReady", () => {
	initGreeter();
});
