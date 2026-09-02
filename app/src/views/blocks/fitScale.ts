import { nothing } from "lit";
import { AsyncDirective, directive, PartType, type ElementPart, type PartInfo } from "lit/async-directive.js";

// Scales an embedded page so it believes it owns the whole display: the iframe renders at the
// host viewport's size (the puppet's real size, portrait included) and is scaled down to its
// block. Scaling is by width with the height derived, so responsive sites adapt like in a
// smaller browser window instead of being cropped (cover) or letterboxed (contain).
//
// Sizes come from the DOM at runtime (the block's box is only known after layout), so this is
// a directive on the iframe element, observing its wrapper. Same lifecycle care as the clock:
// a queued observer callback can outlive disconnected(), hence the isConnected guard.
class FitScaleDirective extends AsyncDirective {
  private _iframe?: HTMLIFrameElement;
  private _observer?: ResizeObserver;
  private _onResize = (): void => this._apply();

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) throw new Error("fitScale must be used on the iframe element itself.");
  }

  render(): unknown {
    return nothing;
  }

  override update(part: ElementPart): unknown {
    if (this.isConnected && !this._observer) {
      this._iframe = part.element as HTMLIFrameElement;
      this._start();
    }
    return nothing;
  }

  private _start(): void {
    const wrapper = this._iframe?.parentElement;
    if (!wrapper) return;
    this._observer = new ResizeObserver(() => this._apply());
    this._observer.observe(wrapper);
    // The wrapper is %-sized and normally resizes with the window, but the viewport is the
    // scale reference, so listen to it directly rather than assuming the layout forwards it.
    window.addEventListener("resize", this._onResize);
    this._apply();
  }

  private _apply(): void {
    const iframe = this._iframe;
    const wrapper = iframe?.parentElement;
    if (!this.isConnected || !iframe || !wrapper || !wrapper.clientWidth) return;
    const scale = wrapper.clientWidth / window.innerWidth;
    iframe.style.width = `${window.innerWidth}px`;
    iframe.style.height = `${wrapper.clientHeight / scale}px`;
    iframe.style.transform = `scale(${scale})`;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention -- lit lifecycle override, name is fixed
  protected disconnected(): void {
    this._observer?.disconnect();
    this._observer = undefined;
    window.removeEventListener("resize", this._onResize);
    // Also fires when the config toggles scaling off (the binding becomes `nothing`): drop the
    // inline sizes so the stylesheet's plain 100% takes over instead of a stale scale.
    if (this._iframe) {
      this._iframe.style.width = "";
      this._iframe.style.height = "";
      this._iframe.style.transform = "";
    }
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention -- lit lifecycle override, name is fixed
  protected reconnected(): void {
    this._start();
  }
}

/** Usage in a template, on the iframe element: `<iframe ${fitScale()} ...>`. */
export const fitScale = directive(FitScaleDirective);
