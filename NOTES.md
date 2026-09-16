# NOTES

Session handoff, written 2026-09-16. Resume from **Next**.

## Task

A Raspberry Pi image with no desktop environment (black screen or logo, the puppet windows appear on it) plus per-puppet window positioning (monitor / x,y / size), with the config builder folded in. Both on an X11 session.

## Done

- v3.0.0 is merged into `main`, tagged, and published as a **pre-release** with the update tarball attached. GitHub "latest" is still v2.0.0 on purpose; the README install command carries `--version v3.0.0` until a stable 3.x exists.
- Windows install test of the published release: pass (installer 42 s, layout correct, clean start/stop twice).
- Raspberry Pi 4 test (Pi OS Bookworm 64-bit, official 7" touch display): install passes, app runs, URL view and block view render on the panel, block edits stream live, clean shutdown. README Pi section updated from it (this commit).
- **Positioning proven on X11.** Layout on the test Pi from `xrandr`: `HDMI-1 primary 1920x1080+0+0` (micro-HDMI beside the USB-C power), `DSI-1 800x480+1920+0`. `--window-position=1920,0 --window-size=800,480 --start-fullscreen` puts a fullscreen Chromium on the DSI screen. With no flags the window lands on the primary (HDMI).
- **Desktop-less session proven.** With the desktop stopped:
  ```bash
  sudo systemctl stop lightdm; sudo xinit /bin/sh -c 'xsetroot -solid black; exec chromium --no-sandbox --password-store=basic --no-first-run --window-position=1920,0 --window-size=800,480 --start-fullscreen https://example.com' -- :1 vt7 -nocursor
  ```
  gives a black HDMI screen, the page fullscreen on the DSI screen, no cursor. `sudo systemctl start lightdm` restores the desktop.
- Touch mapping, recorded but declared OUT of scope for the image: `DISPLAY=:0 xinput map-to-output "10-0038 generic ft5x06 (00)" DSI-1` (session-only, belongs in a startup script if ever wanted).
- The test Pi is left in **X11 mode** (`raspi-config`, option 6, A6), the mode the image needs.

## In progress

Nothing in code. Landing pads for the positioning feature:
- `app/src/puppet/puppeteer/schema.ts`: the commented-out `PuppeteerPuppetWindowConfigSchema` TODO is where `window: { x, y, width, height }` goes (extend `PuppeteerPuppetConfigSchema`).
- `app/src/puppet/puppeteer/PuppeteerPuppet.ts`, `_doInit()`: the `args` array carries `--start-fullscreen` and `--kiosk`; positioning means adding `--window-position=x,y --window-size=w,h` from config and dropping `--kiosk` (see Dead ends for why).
- Config builder: see the "Config generator" and "Puppet window positioning" items in the project backlog (memory), no code yet.

## Dead ends

- **`--kiosk` ignores `--window-position`** and fullscreens on the primary output. `--start-fullscreen` honours the position. Do not retry kiosk for placement.
- **Wayland (labwc, the Pi OS default)** ignores window position entirely: clients cannot place their own windows there. Placement needs X11 (or compositor rules, not pursued).
- **Without `--kiosk`, Chromium shows the "unsupported command-line flag --no-sandbox" infobar** on the display; kiosk mode was hiding it. Open options: `--test-type` (suppresses that infobar), drop `--no-sandbox` when not running as root, or launch plain and place + fullscreen through CDP `Browser.setWindowBounds`. Undecided.
- **Running the X session as root** needs `--no-sandbox` and has no session D-Bus (flood of harmless dbus errors). The image should run the session as the normal user. GCM `PHONE_REGISTRATION_ERROR` lines are Chromium's push registration; `--disable-background-networking` silences them.
- **Puppeteer's browser download on ARM** succeeds but fetches an x86-64 Chrome that cannot exec. `chromiumExecutablePath` is mandatory on the Pi; `PUPPETEER_SKIP_DOWNLOAD=true` only saves the download.
- **Starting the app over SSH** without the desktop's display fails with puppeteer's "Missing X server". Under X11, `DISPLAY=:0` is enough.
- Hardware, not software: a solid **white** touch panel from boot while the kernel reports DSI-1 connected means the display's own small panel ribbon is loose.

## Next

Add `window: { x, y, width, height }` (all optional) to `PuppeteerPuppetConfigSchema` in `app/src/puppet/puppeteer/schema.ts`, and in `PuppeteerPuppet._doInit()` pass `--window-position` and `--window-size` from it and drop `--kiosk` whenever a window is configured. Pick the infobar fix from Dead ends while doing it. Verify on the test Pi with the DSI display at `1920,0`.

## Also open, not part of this arc

- Idle view (splash with admin URLs + QR) for puppets with no assigned view; a fresh install shows a black screen today.
- How a flashed image gets its first puppet (lean: bake one default puppet; boot-partition config adoption later).
- Small code follow-ups: `install.mjs` and `UpdateRunner` should set `PUPPETEER_SKIP_DOWNLOAD` on arm/arm64; the orchestrator logs a stack trace at ERROR for "Puppet not initialized" when a browser fails to launch; the WebServer's DEBUG "New state" line dumps the full state including every release's notes body (hundreds of KB per session).
- v3 screenshots for the README, then a stable 3.x release that becomes GitHub latest.
