# WebKontrol

[![License](https://img.shields.io/github/license/IJIJI/WebKontrol)](https://github.com/IJIJI/WebKontrol/blob/main/LICENSE) [![Version](https://img.shields.io/github/v/release/IJIJI/WebKontrol?display_name=tag&include_prereleases)](https://github.com/IJIJI/WebKontrol/releases) ![Last Commit](https://img.shields.io/github/last-commit/IJIJI/WebKontrol)

WebKontrol turns any machine into a remote-controlled display. It drives one or more screens, each showing a website or a view built from blocks, and everything is managed from a web interface on any device in the network. There is a ready-made Raspberry Pi image, and installed systems update themselves from that interface.

<img src="img/hero.gif" width="100%" alt="The admin on the left assigns views to two displays on the right, then edits a view while it is on screen"/>

> [!NOTE]
> Version 3 is the current version. It is a rewrite of [v2](#v2), which remains available for existing installs but is no longer developed.

## Backstory

I originally built WebKontrol for the live-streaming industry. It allows me to display a clock or use something like [stagetimer.io](https://stagetimer.io/). It turned out to work for information displays and touch kiosks just as well, offering more remote control than most existing solutions I have tried. 

The first two versions only supported a single screen displaying a URL. Version 3 drives multiple screens, builds views from blocks in the web interface, updates itself, and ships as a Raspberry Pi image. Plugins, with data sources from other platforms and conditional rendering, are the next step.

I am planning to sell pre-configured boxes with SDI outputs. If you are interested, [contact me](mailto:shop@synapt.nl).

## Terminology

**Puppets**: Each display that is launched. A puppet handles crashes and failed page loads. All information is displayed in the web interface.

**Views**: A view is a page assignable to a *puppet*. Currently there are two types: A website view, which is just a URL and a block view, which can be built out. The block view can also display websites.

# Getting Started

WebKontrol is Node-based and runs wherever Node runs. It is tested on **Windows 11** and **Raspberry Pi OS Full** on the Raspberry Pi 4. For a Raspberry Pi there is a ready-made image; we are currently working on a Docker image and a Windows installer.

Installed systems can be updated from the admin UI, under settings.

## Raspberry Pi image

The easiest way to run WebKontrol on a Raspberry Pi: an SD card image that boots straight into the displays. There is no desktop; the screens show the WebKontrol logo until the displays come up. Tested on the Raspberry Pi 4; the Pi 3 and Pi 5 are expected to work but are not tested yet.

### Flash

1. Download `WebKontrol_Pi_<version>.img.zst` from the [releases page](https://github.com/IJIJI/WebKontrol/releases).
2. Open [Raspberry Pi Imager](https://www.raspberrypi.com/software/), choose your Pi, then *Choose OS*, *Use custom*, and select the downloaded file. Any card of 8 GB or more works.
3. When Imager offers OS customisation, choose **No**: the image does not use it.

### First boot

Connect the screens and a network cable (the image uses wired networking only), then power on. The first boot grows the system to fill the card, and the first screen shows a display within a minute or so.

Open the admin from any browser on the same network: `http://webkontrol.local/`. If that name does not resolve on your network, find the Pi's address in your router's list of devices.

### Log in over SSH

SSH is off by default. To turn it on, create an empty file named `ssh` (no extension) on the card's boot partition, the one a Windows or Mac computer can open, and boot the Pi with it. Remove the file to turn SSH off again. If Windows shows no drive for the card, see [Open the boot partition on Windows](#open-the-boot-partition-on-windows).

```bash
ssh webkontrol@webkontrol.local
```

The default password is `Welcome@WebKontrol1`. The first login asks for it once more as the current password, then for a new one.

### Open the boot partition on Windows

The card holds two partitions: a small `BOOT` partition that Windows can read, and a larger one it cannot. Windows does not always give `BOOT` a drive letter. To give it one:

1. Right-click the Start button and open *Disk Management*.
2. Find the card (a removable disk the size of your card) and right-click its 512 MB `BOOT` partition.
3. Choose *Change Drive Letter and Paths*, then *Add*, pick a letter and confirm.

Or, in PowerShell run as administrator:

```powershell
Get-Volume -FileSystemLabel BOOT | Get-Partition | Add-PartitionAccessPath -AssignDriveLetter
```

The drive now opens in Explorer. If Windows offers to format a partition on the card, always choose *Cancel*: formatting erases the Pi's system. Eject the card before removing it.

### Screens and displays

The displays are set up in `/opt/webkontrol/config/config.yaml`; the image starts with one display on the first screen. Screens are laid out side by side from left to right, HDMI screens first, then the official touch display. To use a second screen, add a display with its position (see [Window position](#window-position) for finding it) and restart:

```yaml
  - id: display-2
    name:
      long: Display 2
      short: DISP2
    chromiumExecutablePath: /usr/bin/chromium
    window:
      x: 1920
      y: 0
```

```bash
sudo systemctl restart webkontrol
```

A screen without a display keeps showing the logo, so you can see the Pi is on. Screens connected while the Pi runs are picked up after a restart of the service. For a different layout, such as a rotated screen, put your own `xrandr` commands in `/opt/webkontrol/config/display.sh`; the image then runs that instead of its own layout.

The clock uses the Europe/Amsterdam timezone; change it with `sudo timedatectl set-timezone <Area/City>`.

### Updates

The image installs updates like any other WebKontrol install: from the admin UI, under settings. There is no need to flash a newer image.

## Prerequisites

- **Node 22 or newer**, with yarn available through corepack: `corepack enable`
- **tar** (ships with Windows 10+ and every Linux)
- On Linux, the libraries Chromium needs (Raspberry Pi OS Full has them; on a minimal Debian, `sudo apt install chromium` pulls them in)

The installer checks these and tells you what is missing; it never installs anything itself.

## Install
Pick an install directory. In the following example, `/opt/webkontrol` is used

```shell
curl -fsSL https://raw.githubusercontent.com/ijiji/WebKontrol/main/install.mjs -o install.mjs
node install.mjs /opt/webkontrol --version v3.2.1
```

v3.2.1 is published as a pre-release, and the installer never installs pre-releases on its own, so the tag is passed explicitly. Once a stable v3 release exists, drop `--version` and the installer picks the latest stable release by itself.

The installer writes a commented starter `config/config.yaml`; edit it to add your displays (or prepare the file beforehand, the installer keeps an existing one). A minimal config with one display:

```yaml
puppets:
  - id: hall-1
    name:
      long: Hallway display
      short: HALL1

web:
  port: 80
```

You never need git on a device. A git checkout is the developer setup (see [Develop](#develop)) and cannot be updated from the UI.

## Config Guide

`config/config.yaml` holds what must exist before the app starts. Everything else (the views, which display shows what, the theme) is managed in the admin and stored in the database.

```yaml
puppets:
  - id: hall-1                  # 2 to 12 characters: lowercase letters, digits, - and _
    name:
      long: Hallway display     # 3 to 25 characters, shown in the admin
      short: HALL1              # 1 to 10 characters, shown where space is tight
    chromiumExecutablePath: /usr/bin/chromium   # optional: the browser to launch (see Chromium below)
    window:                     # optional: which screen, see Window position below
      x: 1920
      y: 0

web:
  port: 80                      # the admin and the views serve here (default 80)
  sse:
    ping_interval: 1000         # ms between keep-alive pings to the admin (default 1000)

views:
  route_base: /view             # where views are served, /view/<key> (default /view)
```

- `puppets` is the list of displays. Each one launches its own browser. An `id` is stored lowercased.
- `web.port` needs the right to bind low ports on Linux: see [Port 80](#port-80).
- A `config/config.local.yaml` next to it, when present, replaces `config.yaml` entirely (it is never merged). Developers use it for their own displays.

The installer writes a commented starter file with `puppets: []` and `web.port: 80`.

## Run

```shell
cd /opt/webkontrol
node supervisor.js
```

The admin serves on the configured port (default 80). Open `http://<the machine's address>/` from any browser on the network.

To start on boot, run the supervisor from the desktop session's autostart, not as a system service: the browsers need the desktop. See [Start on boot](#start-on-boot) for Raspberry Pi OS; the [Raspberry Pi image](#raspberry-pi-image) does this for you.

## Use

Open the admin in a browser: `http://<the machine's address>/` (or `http://webkontrol.local/` on the image).

**Puppets** lists every display with its status and what it shows. *Assign* puts a view on it; a display without a view of its own shows the default view.

<img src="img/admin-puppets.png" width="640" alt="The Puppets page: two displays, each with a status and an Assign button"/>

**Views** holds what the displays can show. A *website* view is a URL, opened as is. A *blocks* view is built in the editor from blocks: text, a clock, a website, an image, and containers that arrange them (a stack, a grid, free placement). Edits reach the displays as you save, without a reload. *Share* gives a view's own link, to open it in any browser.

<img src="img/admin-views.png" width="640" alt="The Views page: website and blocks views, each with Share and Assign"/>

<img src="img/admin-editor.png" width="640" alt="The block editor: the block tree on the left, the selected block's settings on the right"/>

**Config** holds the theme, the system name and the default load timeout. Its *Releases* button opens the updates page: an installed system updates from there.

A fresh install starts with one view, a clock with the date and the WebKontrol logo, as the default view. When a view fails to load, the display shows a clock with the error and a countdown to the next attempt, and keeps retrying.

<img src="img/display-clock.png" width="640" alt="The default view on a display: a seven-segment clock, the date and the WebKontrol logo"/>


## Install on an existing Raspberry Pi OS

For a Pi that already runs Raspberry Pi OS with its desktop. On a spare card, the [Raspberry Pi image](#raspberry-pi-image) is simpler. The generic install works on Raspberry Pi OS with a few extra steps; other Debian-based desktops probably work the same way, but they are not tested.

### Port 80

Allow Node to bind port 80 without root:

```bash
sudo setcap 'cap_net_bind_service=+ep' `which node`
```

### Chromium

Puppeteer downloads its own Chromium during install, but the build it fetches on a Pi is x86-64 and cannot run there (the install still succeeds; a puppet using it fails with "Syntax error: newline unexpected"). Point each puppet at the system browser instead (find it with `which chromium` or `which chromium-browser`):

```yaml
puppets:
  - id: hall-1
    name:
      long: Hallway display
      short: HALL1
    chromiumExecutablePath: /usr/bin/chromium
```

To skip the useless download, run the installer with `PUPPETEER_SKIP_DOWNLOAD=true` in front of the `node install.mjs` command.

### Window position

With more than one screen, a puppet opens on the primary one. To put it elsewhere, give it a `window`. List the screens with their size and offset in the combined desktop (works over SSH too):

```bash
DISPLAY=:0 xrandr --listmonitors
```

```
Monitors: 2
 0: +*HDMI-1 1920/521x1080/293+0+0  HDMI-1
 1: +DSI-1 800/154x480/86+1920+0  DSI-1
```

Each line reads `width/mm x height/mm + x + y`, so `800/154x480/86+1920+0` is an 800x480 panel at `x: 1920`, `y: 0`:

```yaml
puppets:
  - id: touch-1
    name:
      long: Touch panel
      short: TOUCH
    chromiumExecutablePath: /usr/bin/chromium
    window:
      x: 1920
      y: 0
```

The puppet is always fullscreen on the screen at that position; `x` and `y` are all it needs. `window` also accepts `width` and `height`, which are not needed and can be left out. This only works on an X11 session (`sudo raspi-config`, Advanced Options, Wayland, X11); the Wayland default of Pi OS does not let a window choose its own place.

> [!NOTE]
> Chromium goes fullscreen on the screen that holds most of its starting window, which opens at `x`, `y` with Chromium's default size. If a small screen has a larger one to its right or below it, that window can spill over more onto the neighbour than onto its own screen, and the puppet lands on the neighbour. Setting `width` and `height` to the screen's own size prevents that.

The same `window` works on Windows. Screens left of or above the primary one have negative coordinates there; list them with:

```powershell
Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::AllScreens | ForEach-Object { "$($_.DeviceName) primary=$($_.Primary) $($_.Bounds)" }
```


### Start on boot

The browsers need the desktop, so the supervisor must start inside the desktop session, not as a bare system service. Add the supervisor to the LXDE autostart instead:

```bash
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

```
@sh -c 'cd /opt/webkontrol && node supervisor.js'
```

> [!NOTE]
> This autostart file is read by the X11 desktop, and current Raspberry Pi OS boots a Wayland desktop by default. Switch to X11 with `sudo raspi-config`, option 6, then A6 "Wayland toggle", and reboot. Check which one runs with `echo $XDG_SESSION_TYPE` from a terminal on the desktop.

To start the supervisor by hand over SSH, give it the desktop's display, or the browsers fail with "Missing X server":

```bash
cd /opt/webkontrol && DISPLAY=:0 node supervisor.js
```

### Auto-hide the cursor

```shell
sudo apt-get install unclutter -y
```

Add `@unclutter -idle 2` to the same autostart file (the number is the idle seconds before the cursor hides).

### Disable screen blanking

`sudo raspi-config`, option 2 Display, then D2 Screen Blanking: disable it.

# v2

v2 is the previous generation: one browser, one URL, a small web panel with a clock. It ran in production for a long time and is no longer developed; existing installs can keep using it.

Clone the [v2.0.0 release](https://github.com/IJIJI/WebKontrol/releases/tag/v2.0.0) by its tag:

```shell
sudo git clone https://github.com/IJIJI/WebKontrol.git /opt/WebKontrol --branch v2.0.0
```

Dependencies, the Raspberry Pi steps and autostart are in the [README at v2.0.0](https://github.com/IJIJI/WebKontrol/blob/v2.0.0/README.md). Its own clone line pins an older tag; use the command above instead.

v2 and v3 do not share a config or database; moving a display from v2 to v3 is a fresh install of v3.

# Develop

The repository is the developer setup; end users install with the installer above and never need it.

```shell
git clone https://github.com/IJIJI/WebKontrol.git
cd WebKontrol/app
corepack enable
yarn install
cp config/config.yaml config/config.local.yaml   # your own displays; gitignored, replaces config.yaml when present
yarn dev
```

- `yarn dev` runs the app directly with the admin in Vite's dev mode; a checkout is always "plain mode": the update manager is off and updates are `git pull`.
- `yarn check` runs the assert-based check files, `yarn typecheck` both TypeScript projects, `yarn lint` ESLint.
- `yarn e2e:update` runs the update system end to end against a local fake GitHub (real installer, real supervisor, real tarballs; about 15 minutes). `--hold` keeps the managed system running for clicking through the Updates UI by hand.
- `yarn build` produces `dist/`; `yarn serve` runs it under the supervisor, the way an installed system runs.

Releases are made on GitHub (tag `vX.Y.Z` matching `app/package.json`, notes, the pre-release flag); the workflow builds the update tarball and attaches it, and installed systems see it on their next check.
