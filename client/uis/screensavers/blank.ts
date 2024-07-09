import { ScreensaverBase } from "./base";

export class BlankScreensaver extends ScreensaverBase {
	public getName(): string {
		return "Blank";
	}

	public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
		// Draw a black rectangle that covers the entire canvas
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	}
}
