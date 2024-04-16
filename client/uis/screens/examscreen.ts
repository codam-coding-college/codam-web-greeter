import { Authenticator, AuthenticatorEvents } from "../../auth";
import { UIScreen, UIExamModeElements } from "../screen";
import { LoginScreenUI } from "./loginscreen";
import { ExamForHost } from "../../data";

export class ExamModeUI extends UIScreen {
	public static readonly EXAM_USERNAME: string = 'exam';
	public static readonly EXAM_PASSWORD: string = 'exam';

	public readonly _form: UIExamModeElements;
	private _exam: ExamForHost | null = null;
	private _loginScreen: LoginScreenUI;
	protected _events: AuthenticatorEvents = {
		authenticationStart: () => {
			this._disableForm();
		},
		authenticationComplete: () => {
			// TODO: add loading animation here
		},
		authenticationFailure: () => {
			this._enableForm();
			this._wigglePasswordInput();
		},
		errorMessage: (message: string) => {
			alert(message);
			window.ui.setDebugInfo(message);
		},
		infoMessage: (message: string) => {
			alert(message);
		},
	};

	public constructor(auth: Authenticator, loginUI: LoginScreenUI, exam: ExamForHost | null = null) {
		super(auth);

		// Keep a reference to the login screen so that we can show it when the exam is over
		this._loginScreen = loginUI;

		this._form = {
			form: document.getElementById('exam-form') as HTMLFormElement,
			examProjectsText: document.getElementById('exam-mode-projects') as HTMLSpanElement,
			examStartText: document.getElementById('exam-mode-start') as HTMLSpanElement,
			examEndText: document.getElementById('exam-mode-end') as HTMLSpanElement,
			examStartButton: document.getElementById('exam-mode-start-button') as HTMLButtonElement,
		} as UIExamModeElements;

		this._initForm();

		if (exam !== null) {
			this.setExam(exam);
		}
	}

	/**
	 * Set the exam to display on the exam mode screen.
	 * If no exam is given, the exam mode screen will be hidden and the login screen will be shown instead.
	 * @returns true if the exam mode screen should be shown, false if the login screen is shown instead
	 */
	public setExam(exam: ExamForHost | null): boolean {
		this._exam = exam;
		this._populateData();

		if (this._exam === null) {
			this.hideForm();
			this._loginScreen.showForm();
			return false;
		}
		else {
			this._loginScreen.hideForm();
			this.setLoginButton(false);
			this.showForm();
			const begin_in = new Date(this._exam.begin_at).getTime() - Date.now();
			setTimeout(() => {
				this.setLoginButton(true);
			}, begin_in);
			return true;
		}
	}

	public setLoginButton(enabled: boolean): void {
		(this._form as UIExamModeElements).examStartButton.disabled = !enabled;
	}

	public get exam(): ExamForHost | null {
		return this._exam;
	}

	protected _initForm(): void {
		const form = this._form as UIExamModeElements;

		// This event gets called when the user clicks the unlock button or submits the lock screen form in any other way
		form.examStartButton.addEventListener('click', (event: Event) => {
			event.preventDefault();
			if (this._exam !== null) {
				// Always log in with the username and password given by the back-end server.
				// If no username and password are given, use the default username and password.
				this._auth.login(ExamModeUI.EXAM_USERNAME, ExamModeUI.EXAM_PASSWORD);
			}
			else {
				console.error('Exam is null');
				window.ui.setDebugInfo('Exam is null');
			}
		});
	}

	private _populateData(): void {
		const form = this._form as UIExamModeElements;

		if (this._exam === null) {
			// Unset text that states which exams can be started today
			form.examProjectsText.innerText = '';
		}
		else {
			// Populate text that states which exams can be started today
			const exam = window.data.dataJson?.exams.find((exam) => exam.id === this._exam?.id);
			if (exam === undefined) {
				console.error('Exam not found in data.json');
				window.ui.setDebugInfo('Exam not found in data.json');
				return;
			}
			const projectsText = exam.projects.map((project) => project.name).join(', ');
			form.examProjectsText.innerText = projectsText;

			const examStart = new Date(this._exam.begin_at);
			const examEnd = new Date(this._exam.end_at);
			form.examStartText.innerText = examStart.toLocaleTimeString("en-NL", { hour: '2-digit', minute: '2-digit' });
			form.examEndText.innerText = examEnd.toLocaleTimeString("en-NL", { hour: '2-digit', minute: '2-digit' });
		}
	}

	// Returns true if the exam-start button is disabled, false otherwise
	protected _enableOrDisableSubmitButton(): boolean {
		return false;
	}

	protected _wigglePasswordInput(clearInput: boolean = true): void {
		// This should never happen. Display an error in the debug info bar.
		const message = `Failed to login with username "${ExamModeUI.EXAM_USERNAME}" and password "${ExamModeUI.EXAM_PASSWORD}" to start an exam session`;

		window.ui.setDebugInfo(message);
		console.error(message);
	}

	protected _getInputToFocusOn(): HTMLButtonElement {
		return (this._form as UIExamModeElements).examStartButton;
	}
}
