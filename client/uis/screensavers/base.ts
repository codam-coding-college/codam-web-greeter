export abstract class ScreensaverBase {
	/**
	 * Get the name of the screensaver (should return a static string).
	 */
	public abstract getName(): string;

	/**
	 * Draw 1 frame of the screensaver. Warning: do not request the next animation frame here, it will be done automatically.
	 * @param ctx The rendering context of the canvas elemnt, in 2D mode.
	 * @param canvasWidth The width of the canvas in pixels.
	 * @param canvasHeight The height of the canvas in pixels.
	 */
	public abstract draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void;
}
