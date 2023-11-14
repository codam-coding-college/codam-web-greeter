export class CalendarUI {
	private _calendar: HTMLDivElement;

	public constructor() {
		this._calendar = document.getElementById('intra-calendar') as HTMLDivElement;
	}

	private _addDialogToEvents(): void {
		const events = this._calendar.getElementsByClassName('calendar-event');
		for (let i = 0; i < events.length; i++) {
			const event = events[i];
			event.addEventListener('click', () => {
				console.log("Clicked event", event);
				// Create dialog
				const dialog = document.createElement('dialog');
				dialog.classList.add('calendar-event-dialog');
				dialog.setAttribute("data-event-kind", event.getAttribute("data-event-kind") ?? "event");
				// Add close button
				const dialogCloseButton = document.createElement('button');
				dialogCloseButton.classList.add('dialog-close-button');
				dialogCloseButton.innerHTML = '&times;';
				dialog.appendChild(dialogCloseButton);
				// Create wrapper for contents
				const dialogContents = document.createElement('div');
				dialogContents.classList.add('event-dialog-contents');
				dialogContents.innerHTML = event.innerHTML;
				dialog.appendChild(dialogContents);
				// Close and destroy dialog when clicked outside of it
				dialogContents.addEventListener('click', (ev) => {
					ev.stopPropagation();
				});
				dialog.addEventListener('click', (ev) => {
					dialog.close();
					dialog.remove();
				});
				// Show dialog right now
				document.body.appendChild(dialog);
				dialog.showModal();
			});
		}
	}
}
