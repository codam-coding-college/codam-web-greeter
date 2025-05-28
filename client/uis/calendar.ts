import { DataJson, Event42 } from "../data";
import { Data } from "../data";
import { UI } from "../ui";

export class CalendarUI {
	private _calendar: HTMLDivElement;

	public constructor(dataHolder: Data) {
		this._calendar = document.getElementById('intra-calendar') as HTMLDivElement;
		this.populateCalendar();
		dataHolder.addDataChangeListener(this.populateCalendar.bind(this));
	}

	private _estimateDuration(beginAt: Date, endAt: Date): string {
		const duration = endAt.getTime() - beginAt.getTime();

		const days = Math.floor(duration / 1000 / 60 / 60 / 24);
		const hours = Math.floor(duration / 1000 / 60 / 60);
		const minutes = Math.floor(duration / 1000 / 60);

		if (days > 1) {
			return `${days} days`;
		}
		else if (hours > 0) {
			return `About ${hours} hour${hours === 1 ? '' : 's'}`;
		}
		else if (minutes > 0) {
			return `About ${minutes} minute${minutes === 1 ? '' : 's'}`;
		}
		return "";
	}

	private _removeMarkdownSyntax(text: string): string {
		// Parse bold text
		text = text.replace(/\*\*(.*?)\*\*/g, '$1');

		// Parse italic text
		text = text.replace(/\*(.*?)\*/g, '$1');
		text = text.replace(/\_(.*?)\_/g, '$1');

		// Parse links
		text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');

		return text;
	}

	/**
	 * This function checks if there is still enough space on the screen to fit one more event.
	 */
	private _eventFitsOnScreen(eventElement: HTMLDivElement | undefined = undefined): boolean {
		// Get required input
		const availableWindowHeight = window.innerHeight;
		const infoBarHeight = parseInt(getComputedStyle(this._calendar).getPropertyValue('--header-footer-height')) * window.ui.scalingFactor;
		const calendarHeight = this._calendar.clientHeight * window.ui.scalingFactor;
		const eventHeight = 78 * window.ui.scalingFactor; // Assume every event takes up 78 pixels * UI scaling factor
		const eventMargin = parseInt(UI.getPadding(this._calendar)) * window.ui.scalingFactor;

		// Calculate how much space is needed for the event
		const requiredSpace = eventHeight + eventMargin;

		// Calculate how much space is left on the screen
		const spaceLeft = availableWindowHeight - calendarHeight - (infoBarHeight * 2) - (eventMargin * 2);

		console.debug("Calculated if event fits on screen",
			"availableWindowHeight", availableWindowHeight,
			"calendarHeight", calendarHeight,
			"eventHeight", eventHeight,
			"eventMargin", eventMargin,
			"requiredSpace", requiredSpace,
			"spaceLeft", spaceLeft,
			"scalingFactor", window.ui.scalingFactor
		);

		return requiredSpace < spaceLeft;
	}

	private populateCalendar(dataJSON: DataJson | undefined = window.data.dataJson): void {
		if (dataJSON === undefined) {
			this._destroyAllEvents();
			return;
		}
		const eventsForCalendar: HTMLDivElement[] = [];
		for (const event of dataJSON.events) {
			eventsForCalendar.push(this._createEventElement(event));
		}
		for (const exam of dataJSON.exams) {
			const event = Data.examToEvent(exam); // convert exam to event
			eventsForCalendar.push(this._createEventElement(event));
		}
		// Sort events by begin timestamp (mix exams and events)
		eventsForCalendar.sort((a, b) => {
			return parseInt(a.getAttribute("data-event-timestamp") ?? "0") - parseInt(b.getAttribute("data-event-timestamp") ?? "0");
		});
		this._destroyAllEvents();
		for (const event of eventsForCalendar) {
			if (!this._eventFitsOnScreen(event)) {
				console.log("Event doesn't fit on screen");
				break; // don't add any more events if one doesn't fit
			}
			this._calendar.appendChild(event);
		}
	}

	private _destroyAllEvents(): void {
		const events = this._calendar.getElementsByClassName('calendar-event');
		while (events.length > 0) {
			events[0].remove();
		}
	}

	private _createEventElement(event: Event42): HTMLDivElement {
		// Parse dates
		const beginDate = new Date(event.begin_at);
		const endDate = new Date(event.end_at);

		// Main element
		const calendarEvent = document.createElement('div');
		calendarEvent.classList.add('calendar-event');
		calendarEvent.setAttribute("data-event-kind", (event.name.toLowerCase().includes("bocal q&a") ? "standup" : event.kind));
		calendarEvent.setAttribute("data-event-id", event.id.toString());
		calendarEvent.setAttribute("data-event-timestamp", beginDate.getTime().toString());

		// Date element
		const calendarEventDate = document.createElement('div');
		calendarEventDate.classList.add('calendar-event-date');
		calendarEvent.appendChild(calendarEventDate);

		const calendarEventDateDay = document.createElement('span');
		calendarEventDateDay.classList.add('calendar-event-date-day');
		calendarEventDateDay.innerText = beginDate.toLocaleString('en-NL', { weekday: 'short' });
		calendarEventDate.appendChild(calendarEventDateDay);

		const calendarEventDateDate = document.createElement('span');
		calendarEventDateDate.classList.add('calendar-event-date-date');
		calendarEventDateDate.innerText = beginDate.toLocaleString('en-NL', { day: 'numeric' });
		calendarEventDate.appendChild(calendarEventDateDate);

		const calendarEventDateMonth = document.createElement('span');
		calendarEventDateMonth.classList.add('calendar-event-date-month');
		calendarEventDateMonth.innerText = beginDate.toLocaleString('en-NL', { month: 'short' });
		calendarEventDate.appendChild(calendarEventDateMonth);

		// Event info
		const calendarEventWrapper = document.createElement('div');
		calendarEventWrapper.classList.add('calendar-event-wrapper');
		calendarEvent.appendChild(calendarEventWrapper);

		const calendarEventTitle = document.createElement('div');
		calendarEventTitle.classList.add('calendar-event-title');
		calendarEventTitle.innerText = event.name;
		calendarEventWrapper.appendChild(calendarEventTitle);

		const calendarEventDesc = document.createElement('div');
		calendarEventDesc.classList.add('calendar-event-description');
		calendarEventDesc.innerText = this._removeMarkdownSyntax(event.description);
		calendarEventWrapper.appendChild(calendarEventDesc);

		// Event details
		const calendarEventDetails = document.createElement('div');
		calendarEventDetails.classList.add('calendar-event-details');
		calendarEventWrapper.appendChild(calendarEventDetails);

		const calendarEventTime = document.createElement('span');
		calendarEventTime.classList.add('calendar-event-time');
		calendarEventTime.innerText = beginDate.toLocaleString('en-NL', { timeStyle: 'short' });
		calendarEventDetails.appendChild(calendarEventTime);

		const calendarEventDuration = document.createElement('span');
		calendarEventDuration.classList.add('calendar-event-duration');
		calendarEventDuration.innerText = this._estimateDuration(beginDate, endDate);
		calendarEventDetails.appendChild(calendarEventDuration);

		const calendarEventSpots = document.createElement('span');
		calendarEventSpots.classList.add('calendar-event-spots');
		calendarEventSpots.innerText = (event.max_people ? `${event.nbr_subscribers} / ${event.max_people}` : '');
		calendarEventDetails.appendChild(calendarEventSpots);

		const calendarEventLocation = document.createElement('span');
		calendarEventLocation.classList.add('calendar-event-location');
		calendarEventLocation.innerText = event.location ?? '';
		calendarEventDetails.appendChild(calendarEventLocation);

		// Add dialog to event
		this._addDialogToEvent(calendarEvent);

		return calendarEvent;
	}

	private _addDialogToEvent(eventElement: HTMLDivElement): void {
		eventElement.addEventListener('click', () => {
			console.log("Clicked event", eventElement);

			// Create dialog
			const dialog = document.createElement('dialog');
			dialog.classList.add('calendar-event-dialog');
			dialog.setAttribute("data-event-kind", eventElement.getAttribute("data-event-kind") ?? "event");

			// Add close button
			const dialogCloseButton = document.createElement('button');
			dialogCloseButton.classList.add('dialog-close-button');
			dialogCloseButton.innerHTML = '&times;';
			dialog.appendChild(dialogCloseButton);

			// Create wrapper for contents (clone event element for data)
			const dialogContents = document.createElement('div');
			dialogContents.classList.add('event-dialog-contents');
			dialog.appendChild(dialogContents);
			for (const child of eventElement.children) {
				dialogContents.appendChild(child.cloneNode(true));
			}

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

	private _addDialogToEvents(): void {
		const events = this._calendar.getElementsByClassName('calendar-event');
		for (let i = 0; i < events.length; i++) {
			const event = events[i];
			this._addDialogToEvent(event as HTMLDivElement);
		}
	}
}
