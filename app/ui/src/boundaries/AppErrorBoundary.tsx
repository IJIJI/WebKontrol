import { Component, type JSX } from "react";


// Error boundary that catches render crashes caused by Vite HMR context
// identity mismatches.
// The API is polled until the server is confirmed ready, then do a clean reload.
// TODO: Rewrite
// TODO: Less css!
export class AppErrorBoundary extends Component<
{ children: JSX.Element },
{ hasError: boolean; error: string | null }
> {
  state = { hasError: false, error: null }
  private _poll?: ReturnType<typeof setInterval>
  
  static getDerivedStateFromError(error: Error): { hasError: true, error: string } {
    return { hasError: true, error: error.message }
  }

  componentDidUpdate(_: unknown, prev: { hasError: boolean }): void {
    if (!prev.hasError && this.state.hasError) {
      this._poll = setInterval(() => {
        fetch('/', { method: 'HEAD' })
          .then((res) => {
            if (res.ok) window.location.reload();
          })
          .catch(() => {
            // server not ready yet — keep waiting
          })
      }, 2000)
    }
  }

  componentWillUnmount(): void {
    if (this._poll) clearInterval(this._poll)
  }

  render(): JSX.Element {
    if (!this.state.hasError) return this.props.children;
    
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', gap: 8,
        background: 'var(--color-background-primary)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Reconnecting…
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          Waiting for the server to come back up.
        </div>
        {this.state.error && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 6, maxWidth: 420,
            background: 'color-mix(in srgb, #E24B4A 10%, transparent)',
            border: '0.5px solid color-mix(in srgb, #E24B4A 40%, transparent)',
            fontSize: 11, color: '#E24B4A', textAlign: 'center', wordBreak: 'break-word',
          }}>
            {this.state.error}
          </div>
        )}
      </div>
    )
  }
}
