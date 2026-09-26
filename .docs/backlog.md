# Backlog

Work with no moment yet. Pick from here when [todo.md](todo.md) is done, or when an item fits
the current work; once an item has a moment it moves to the todo. Entries can be old: reassess
one against the code and [decisions.md](decisions.md) before starting it. Larger items have
an entry (what, why not now, trigger, notes); small items are one line.

## First candidates after the first stable release

### Data sources
*What:* the runtime behind the existing types (`DataSourceKey`, `bindable()` in
`src/views/blocks/types/schema.ts`); nothing supplies values yet. Updates are pushed over the
view's existing SSE stream.
*Why not now:* no consumer before the setup page.
*Trigger:* starting the setup page.
*Notes:* keys follow the namespace pattern (`webkontrol::data::time`). First consumers are
the network addresses (setup page), then `webkontrol::data::time`, so the date and time block
ticks from the server instead of its own timer. Data sources also unlock the cleaner dual tone
below. Open in the bindings: enforce binding types through a namespaced data type key; unify
the slot metadata and the brand; nullable slots only if needed.

### Setup page
*What:* the start screen on a fresh install: the admin addresses
(`http://<ip>[:port]/` per non-internal IPv4 interface, the port left out at 80) and a QR
code. A seeded block view fed by an addresses data source, so offline boots and DHCP changes
update live. v2's `OsDetails.getAddresses` ports into the empty
`src/system/network/NetworkDetails.ts`.
*Why not now:* it needs data sources, and the QR code needs a phone-friendly admin.
*Trigger:* data sources exist and the mobile todo item is done.
*Notes:* shown through the default view or per puppet is an open question in decisions.
A scan lands on a phone, hence the mobile dependency.

### QR code library
*What:* the only QR package, `qrcode.react` (admin ShareModal), is React-only and cannot run
in the view client or on the server. Candidate: `qrcode-generator` (MIT, no dependencies, SVG
output, browser and Node).
*Why not now:* only the setup page needs it.
*Trigger:* the setup page.
*Notes:* verify its API and types when picked.

### Blank view
*What:* an assignable blank view, also what a puppet gets when it is cleared.
*Why not now:* `about:blank` (black) does the job.
*Trigger:* a need to assign "nothing" explicitly.

### Fonts: review and add more
*What:* bundled OFL fonts plus system fonts (FONT_SUGGESTIONS must match what renders),
including a better monospace; uploaded fonts after that. Also a "clock" preset applied when a
date and time block is inserted (see decisions: no schema default font).
*Why not now:* not needed for stable.
*Trigger:* the next font request or the units item.
*Notes:* the maintainer dislikes the system monospace.

### Then, roughly in this order
- The Companion module together with the documented remote-control API.
- A config builder with boot-partition adoption (files placed on BOOT that the image adopts on
  first boot, including the user password), since Imager customisation does not apply.
- Display rotation, a windowed or borderless mode, and richer placement and sizing than
  `window: {x, y, width, height}` (rotation through xrandr per output or rotating the page;
  borderless needs an openbox rule or Chromium's `--app`).
- Timezone-independent clocks: the date and time block renders in the viewer's timezone
  (the Pi's on a display, the laptop's in the preview); a configurable timezone through
  `Intl`'s `timeZone`. The image bakes Europe/Amsterdam for now.
- Screens plugged in after boot are not laid out (the session does it once); a udev hotplug
  hook could rerun it. The README says to restart the service.
- The Docker decision (open question in decisions), then the Electron Windows launcher (tray,
  start on login; it must create and run the same managed layout so updates take one path).
- A cleaner dual tone: a segment display block, or a COLRv1 colour font generated from DSEG,
  once data sources exist.

## Deploy, update, release

- Accepted audit findings (2026-09-19, dev and build only): esbuild 0.27.7 (fixed by bumping
  our devDependency to ^0.28), esbuild 0.18.20 and `@esbuild-kit/*` through drizzle-kit (wait
  for drizzle-kit), image-size 0.5.5 through less, prebuild-install 7.1.3 through
  better-sqlite3 12 (13 is a major). Re-run the audit before each release.
- The supervisor confirms an update to the app over IPC; the app's 90 s timer stays as the
  fallback without a supervisor.
- Branch builds: `workflow_dispatch` building a branch, tagged `v<pkg>-branch.<name>.<run>`;
  maybe a hidden custom-tarball install behind friction.
- Destructive downgrade with consent (clear the database in one transaction with the
  `user_version` reset).
- Snapshot and backup management in Settings (named snapshots, restore, retention).
- A dismissible "ok" on the journal bubble.
- The production stubs hidden behind `import.meta.env.DEV` (export, import and reset groups,
  the Status and Hardware rows): build them for real before showing them.
- Small: `UpdateManager.ts` input interface and the restart-to-activate edge case;
  `GitHubReleases.ts` `_latest` cleanup.

## Puppets and server

- Viewport (resolution) settings per puppet (`defaultViewport: null` today).
- Remote key and mouse presses into a puppet; more puppet control (overlay, borders).
- Choose the browser (Chrome, Firefox).
- Puppet page info and screenshots: screenshots served by URL
  (`GET /api/puppets/:id/screenshot`), never in the state; retention; page metadata.
- Handle a failed dialog dismiss or pop-up close (the catches are empty).
- Puppeteer launch defaults in one place.
- Bound `_doClose` with a timeout of about 10 s, once a puppet is seen stuck in CLOSING.
- Extract a state holder from AbstractPuppet.
- Check who re-navigates after a crash or reconnect (the orchestrator should) and whether
  `init()` resets the closing state.
- A reachability probe from Node before retrying network and timeout failures, so the fallback
  page is not replaced by Chromium's error page on every retry.
- Puppet event history: a ring buffer of state transitions ("what happened overnight"), with a
  clamp for negative durations on a Pi without a clock battery.
- Status reporting: a countdown to the next retry; plain-language `net::` codes with the raw
  code on hover; one derived status instead of connection plus navigation.
- A logging severity pass: the severity follows the state a sequence ends in.
- `WebServer.ts`: one `sendError` for the repeated 500 shape; a route path review.
- Config: an environment override for the config path; derive a short name from the id.
- One generic runtime store instead of four stores with the same functions.
- AppCore and LifeCycle tidy-ups; move `helpers/json.ts` and `helpers/error.ts` to
  `common/helpers/`.
- CoreDatabase: WAL journal mode; close the database on shutdown.
- ViewServer: handle a deleted view better; a configurable view base path.
- The registry: check that a broken plugin's "namespace already claimed" error is shown, not a
  crash.
- A view readiness signal, only if a silently broken view ever happens.
- Beacon integration.

## Blocks and views

- A timed rotation block that cycles its children.
- A view block that embeds another view (with a cycle guard).
- Conditional rendering (if/else, switch, live re-evaluation).
- Richer iframe scaling for the website block (a factor, a fixed virtual viewport).
- A better grid setting (a track editor with fr units; per-child placement needs item
  wrappers, the same fix as for stack items).
- Who gives way when a stack does not fit.
- Copy and paste through the system clipboard with keyboard shortcuts.
- User CSS for views (global first).
- Image uploading (storage and a served route).
- Better per-axis size defaults; a richer aspect-ratio setting.
- Backend block validation (needs the deferred schema/render split).
- Stable child identity in free form and grid, so toggling or reordering does not reload
  iframes.
- An editor warning when a block has no room.
- Grid schema: auto-arrange and templates.

## Settings and fields

- Conditional fields in the editor ("show this field when"). The next setting that only
  applies in some combinations is the trigger. Hard case: a value inherited from a parent
  cannot be resolved while editing one block.
- A border setting: width, style and colour in one row, stored as the CSS shorthand.
- UnitInput: one number-and-unit control for BoxSetting, SizeSetting and TrackSetting (the
  units todo item builds on it); decide whether `rem` is wanted.
- Visual editors still missing: box and text shadow, gradients, a rotation dial.
- Clean up the options: no two options may look the same; decide what unset means per field.
- A uniformity pass across widgets (captions, widths, picker sizes).
- Inline validation for the view's own fields.
- Settings page number fields: min from zod, the default as placeholder, a way to unset, a unit.

## Admin

- A view page with sections (assignments, health, usage) and a `PuppetChip`.
- ViewPicker search and smaller cards.
- A global tag registry.
- Icons: curate the common set or adopt a library.
- An empty state on the Views page.
- The connection toast: tell reconnecting apart from failed.
- `sse.ping_interval` allows up to 25 s while the admin's watchdog is 7.5 s: above that the
  admin reconnects every 7.5 s. Lower the schema maximum or derive the watchdog from it.
- ApiStateContext: per-view URLs from the backend; validate the state before applying it.
- An error boundary rewrite.
- Layout: one header for desktop and mobile, a breadcrumb component.

## Docs

- `app/README.md` is one line.

## Much later

### Microkernel core
*What:* a base core reused across several projects, with the rest of the app built on top of
it.
*Why not now:* much later (2026-09-26); nothing about its shape is decided.
*Trigger:* none yet.
*Notes:* the idea came from adapting WebKontrol's web server from Beacon's. The plugin system
already needs part of such a core.
