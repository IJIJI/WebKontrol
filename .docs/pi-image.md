# The Raspberry Pi image

## Design

- Built with rpi-image-gen, pinned to commit `89f5e5d` in `pi-image/build.sh` (its layer names
  have changed under HEAD before). Debian trixie, device layer `rpi4`.
- **X11 with openbox, no desktop.** A systemd unit starts `xinit` with
  `pi-image/files/webkontrol-session` as the configured user, after `network.target` (it
  does not wait for the network to be online).
  The session paints the screens black, disables blanking, lays the screens out, starts
  openbox, sets `splash.png` as the background on every screen, then runs the supervisor.
- **Screen layout**: HDMI first at 0,0 as primary, then each next screen to its right (below
  when xrandr refuses that). `/opt/webkontrol/config/display.sh`, when present,
  replaces the layout with its own `xrandr` commands.
- **The app** is installed in the image by `install.mjs` from the release tarball (a managed
  install, so it updates itself), with Node 22 for arm64 in `/usr/local`. The baked config has
  one puppet, `display-1`, with `chromiumExecutablePath: /usr/bin/chromium`.
- **Wired networking only.** Hostname `webkontrol`.
- **Credentials**: user `webkontrol` with the public default password `Welcome@WebKontrol1`,
  changed at the first login. SSH is off until an empty `ssh` file is placed on the boot
  partition.
- **Boot**: the rainbow screen is disabled (`disable_splash=1`); the kernel shows
  `pi-image/splash.tga`; the first boot grows the root partition to fill the card
  (`webkontrol-growfs`). The boot partition is 512 MB FAT32, labelled `BOOT`.
- **Splash images**: `splash.png` is 1920x1080; `pi-image/splash.tga` is 640x360, 24-bit
  uncompressed, under 224 colours (a larger one wraps on the 800x480 touch display). Both show
  the wordmark with the `V3` subline, rendered from the admin's logo.
- **Build**: `bash pi-image/build.sh [tag]` in WSL2 or on Debian/Ubuntu, about 30 minutes;
  without a tag it takes the version from `app/package.json`. The layer's version variable is
  required, so a direct rpi-image-gen run without one fails instead of building an old release.
  CI builds and attaches the image for every published release.

## Hardware facts

- Tested on a Raspberry Pi 4 with an HDMI monitor and the official 7" touch display. The Pi 3
  and Pi 5 are expected to work but are untested.
- On the test Pi, `xrandr` reports `HDMI-1 1920x1080+0+0` and `DSI-1 800x480+1920+0`: a puppet
  on the touch display takes `window: {x: 1920, y: 0}`.
- Window placement needs X11: under Wayland a client cannot place its own window.
- Touch on the second screen needs `xinput map-to-output` to land on the right screen; touch is
  out of scope for the image.
- A solid white touch display while the kernel reports DSI connected was a loose ribbon on
  the display's own panel.

## Dead ends

- **No window manager**: Chromium asks the window manager to size a fullscreen window, so
  without one a puppet covered only part of its screen. The image runs openbox.
- **`PAMName=login` in the unit** looped forever on a fresh box: the forced-change password
  counts as expired and PAM refuses the session. Removed.
- **Waiting for `network-online.target`** delayed the displays about two minutes per boot, and a
  display must start offline anyway.
- **A 1280x720 kernel splash** wrapped on the 800x480 touch display.
- **Raspberry Pi Imager customisation** does not reliably apply to rpi-image-gen images; the
  README tells users to choose No. Boot-partition files the image adopts on first boot are the
  planned route instead (backlog: config builder).
- **cage or labwc instead of X11**: no per-output window placement.
- **Chrome's `ERR_UNSAFE_PORT` on port 22** is Chrome refusing the port, not a test of SSH; use
  `Test-NetConnection webkontrol.local -Port 22`.
- **`webkontrol.local` not resolving** on some networks is mDNS being blocked (for example
  client isolation); `systemctl status avahi-daemon` on the Pi rules the Pi out.
