# NOTES

Session handoff, written 2026-09-19. Resume from **Next**.

## Task

Get v3 to its first stable release marked GitHub latest: close the remaining v2 gaps and polish, starting with two small log fixes.

## Done

- **v3.1.0** (pre-release): per-puppet `window: { x, y }` positioning (`width`/`height` accepted, documented as not needed). Verified on a Pi 4 (HDMI + official touch display) and on Windows across three monitors.
- **v3.2.0** (pre-release): the Raspberry Pi image (`pi-image/`, rpi-image-gen, trixie, X11 with openbox, no desktop), built and attached by `.github/workflows/release.yml` after the tarball. Update checks recover after an offline start (retry at 30 min doubling to 16 h). Installer skips Puppeteer's download on ARM and accepts `GITHUB_TOKEN`. A test box updated v3.1.0 to v3.2.0 from the admin.
- **v3.2.1** (pre-release, published 2026-09-19): the three image commits that missed v3.2.0 (card grows on first boot, 512 MB FAT32 boot partition, versioned image name `WebKontrol_Pi_<tag>.img.zst`, CI disk cleanup) plus the README "Raspberry Pi image" section. No app change. v3.2.0's release notes were corrected to point at v3.2.1's image.
- **Image verified on a Pi 4** (local build): no rainbow, logo on every screen, screens laid out side by side (HDMI first, then the touch display), puppet fullscreen, card grows (29 GB root on a 32 GB card), SSH off by default and on via an `ssh` file, forced password change, kill / reboot / power loss / offline boot all recover.
- **History cleanup**: the two commits with an AI co-author trailer were reworded; `main`, `dev`, `v3.1.0`, `v3.2.0` force-pushed. `v3.0.0` and older untouched.
- **Decided**: the red FAILED view status pill for an assigned view is intended (it signals danger). The Companion remote-control API docs ship later together with a Companion module, not before latest. The fullscreen "press Esc" hint on positioned puppets is accepted.

## In progress

Nothing in code; the working tree is clean at `bcd2387` (Version 3.2.1).

Pending outside code:
- **Deferred tests**, to run together with the tests of the first release marked latest: update a box v3.2.0 to v3.2.1 from the admin; fresh-card test of `WebKontrol_Pi_v3.2.1.img.zst` (`df -h /` near card size, `sudo journalctl -u webkontrol-growfs -b` shows the growth, `lsblk -f` shows BOOT as vfat 512M, whether Windows gives BOOT a letter by itself, and the README's untested `Get-Volume -FileSystemLabel BOOT | Get-Partition | Add-PartitionAccessPath -AssignDriveLetter`).
- **Delete the rewrite backup** after a few days (from `app/`, PowerShell):
  ```powershell
  git for-each-ref --format="%(refname)" refs/original | ForEach-Object { git update-ref -d $_ }
  ```

## Dead ends

- **`git filter-branch` over all branches and tags rewrote the whole history**: it strips the `gpgsig` header from every commit it processes, and GitHub signs web merges, so every descendant got a new ID. Limit it to the commits that must change (`-- <refs> ^<parent-of-first> ^<last-untouched-tag>`). It also only runs from the repo top level (`git -C ..` from `app/`).
- **PowerShell pipes into `git update-ref --stdin` fail** ("expected SP"): loop in PowerShell and call `git update-ref` per ref instead.
- **No window manager means Chromium cannot fullscreen properly**: `--kiosk`/`--start-fullscreen` ask the WM to size the window, so the image runs `openbox`. Kiosk mode ignores `--window-position`, so positioned puppets run without it.
- **`PAMName=login` in the image's unit** looped forever on a fresh box: the forced-change (expired) password makes PAM refuse the session. Removed.
- **Waiting for `network-online.target`** delayed the display ~2 minutes per boot (wlan0 never comes up). The unit orders after `network.target` only.
- **A 1280x720 splash TGA** wrapped in the 800x480 touch display's framebuffer; it is 640x360 now. The firmware rainbow cannot be customised, only disabled (`disable_splash=1`).
- **Raspberry Pi Imager customisation** does not reliably apply to rpi-image-gen images; skipped. Wayland cannot place windows; the image is X11.
- **Chrome's `ERR_UNSAFE_PORT` on port 22** is Chrome refusing the port, not a test of SSH; use `Test-NetConnection webkontrol.local -Port 22`.

## Next

Two log fixes, then release notes material for the next pre-release:
1. `app/src/webServer/WebServer.ts`, `setState()`: the `this._logger.debug("New state:", state)` line dumps the whole state on every change, including every release's full notes body (hundreds of KB per session on an SD card). Log a short summary instead (for example the puppet states and the update activity), never `releases[].notes`.
2. `app/src/orchestration/puppet/PuppetOrchestrator.ts`, `_navigatePuppet()`: the catch logs `Navigation failed for puppet "<id>".` at ERROR with the full error, which for "Puppet not initialized" (thrown by `AbstractPuppet` while a browser failed to launch or is closing) prints a stack trace for an expected state. Log that case at warn without the stack; keep ERROR for real failures.

Then, in order (full list and both release checklists in the project backlog): idle view with the admin address and a QR code, a clock view seeded on a fresh install, the admin reconnecting by itself after a server restart, a branded boot splash, the README ready for stable (v3 screenshots), then the stable 3.x marked latest.
