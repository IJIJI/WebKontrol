import { AsyncDirective, directive } from "lit/async-directive.js";
import { formatPhpDate } from "./phpDate";

// A self-updating clock value for the datetime block. A directive keeps the tick local to the
// binding: it starts when rendered, updates its own text, and stops when the host removes it.
// TODO: The designed long-term path for live values is a data source (webkontrol::data::time)
// subscribed through RenderContext; move the tick there once a second live consumer exists.
class ClockDirective extends AsyncDirective {
  private _format = "";
  private _timer: ReturnType<typeof setTimeout> | undefined;

  render(format: string): string {
    this._format = format;
    this._schedule();
    return formatPhpDate(format, new Date());
  }

  // Align each tick to the next wall-clock second, so seconds never visibly skip or stall the
  // way a plain setInterval(1000) drifts into.
  private _schedule(): void {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      // A queued callback can outlive disconnected() (clearTimeout can't cancel an already
      // queued task); without this guard it would re-arm the timer forever.
      if (!this.isConnected) return;
      this.setValue(formatPhpDate(this._format, new Date()));
      this._schedule();
    }, 1000 - (Date.now() % 1000));
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention -- lit lifecycle override, name is fixed
  protected disconnected(): void {
    clearTimeout(this._timer);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention -- lit lifecycle override, name is fixed
  protected reconnected(): void {
    this._schedule();
  }
}

/** Usage in a template: `${clock(config.format)}`. */
export const clock = directive(ClockDirective);
