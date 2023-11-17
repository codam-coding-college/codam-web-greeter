export interface UIInfoElements {
	hostname: HTMLSpanElement;
	version: HTMLSpanElement;
	clock: HTMLSpanElement;
	date: HTMLSpanElement;
	networkIcon: HTMLSpanElement;
	debug: HTMLSpanElement;
}

export class InfoBarsUI {
	private _infoElements: UIInfoElements;

	public constructor() {
		this._infoElements = {
			hostname: document.getElementById('info-hostname') as HTMLSpanElement,
			version: document.getElementById('info-version') as HTMLSpanElement,
			clock: document.getElementById('info-clock') as HTMLSpanElement,
			date: document.getElementById('info-date') as HTMLSpanElement,
			networkIcon: document.getElementById('info-network-icon') as HTMLSpanElement,
			debug: document.getElementById('info-debug') as HTMLSpanElement,
		};

		this._populateInfoElements();
	}

	private _populateInfoElements(): void {
		// Populate debug info
		this._infoElements.debug.innerText = '';
		window.addEventListener('error', (event: ErrorEvent) => {
			this._infoElements.debug.innerText += event.error + '\n';
		});

		// Populate version info
		this._infoElements.version.innerText = window.data.pkgName + " v" + window.data.pkgVersion;

		// Populate hostname info
		this._infoElements.hostname.innerText = window.data.hostname;

		// Populate clock element
		this._updateClock();
		setInterval(() => this._updateClock(), 1000);

		// Populate network icon
		this._infoElements.networkIcon.innerHTML = (navigator.onLine ? 'Online' : 'Offline');
		window.addEventListener('online', () => this._infoElements.networkIcon.innerHTML = 'Online');
		window.addEventListener('offline', () => this._infoElements.networkIcon.innerHTML = 'Offline');
	}

	private _updateClock(): void {
		const now: Date = new Date();
		this._infoElements.date.innerText = now.toLocaleString('en-NL', { dateStyle: 'medium' });
		this._infoElements.clock.innerText = now.toLocaleString('en-NL', { timeStyle: 'medium' });
	}
}
