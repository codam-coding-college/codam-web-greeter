// Import local classes
import { Data } from './data';
import { UI } from './ui';
import { Authenticator } from './auth';

declare global {
	interface Window {
		data: Data;
		ui: UI;
		auth: Authenticator;

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
	window.ui = new UI();
	window.auth = new Authenticator();
}

window.addEventListener("GreeterReady", () => {
	initGreeter();
});
