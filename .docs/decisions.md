# Decisions

Open questions first, then settled decisions by area, with the date, the reason and the
rejected alternatives. Settled means settled: reopen one only with new facts. Add to this file
when a decision is made; keep rejected alternatives.

## Open questions

- **The update layout's two files**: keep `current` (a text pointer) and
  `releases/pending.json` as they are, or unify them as JSON. Lean: keep, with one comment in
  the layout documentation.
- **Docker**: (a) a managed root on a volume, so in-container updates persist, or (b) an image
  per version with updates off ("managed by Docker"). Nothing in the code prejudges it.
- **Node minimum**: node-gyp 13 (Yarn's builder for better-sqlite3) declares Node 22.22.2 or
  newer, while the README and `install.mjs` accept any Node 22. It only matters when
  better-sqlite3 has no prebuilt binary. Raise the minimum to 22.22 or leave it.
- **Block info, open since 2026-07-29**: an icon id set or a raw SVG escape hatch for plugin
  icons; whether `info` is exposed as a block catalogue over the wire; a category and order
  for the block picker; a bounded short label derived from config (`{field}` interpolation
  with a length cap, never a mini-language). Reassess against the code before deciding.
- **The setup page on a fresh install** (when it is built): shown through the default view,
  or assigned per puppet.

## Release and deployment

- **GitHub "latest" is the single source of "newest stable"** for the installer's default and
  the update announcement. A pre-release can never be latest, so while only pre-releases
  exist the README pins `--version`. The workflow runs on `release: published`; the tag must
  equal `app/package.json`'s version.
- **Pi image files carry the release version**: `WebKontrol_Pi_<tag>.img.zst` (2026-09-18).
  Only v3.2.0's asset is `WebKontrol_Pi.img.zst`, because the naming commit missed it.
- **Deployment vehicles**: the Pi image, Docker, an Electron Windows launcher. The installer
  stays layout-only: it checks prerequisites, installs nothing itself, pins with `--version`,
  and prints no systemd unit (a system service cannot open the browser windows; on Linux it
  points at the README's "Start on boot"). End users never git clone. Desktop-less boot
  belongs to the image, not the installer.
- **Branches** (2026-09-26): `dev` is the release line, `next` holds the next features, fixes
  flow forward `dev` to `next`. Rejected: developing features on `dev` during a soak, which
  would block soak fixes.
- **The first stable release does not need** the setup page (it waits for data sources) or
  the Companion API documentation (it ships with a Companion module later).

## Updates

- Artifacts, not a git rebuild. Downgrades are allowed when they lose no data. Migrations are a
  forward-only chain keyed by `user_version`; a rollback restores the pre-migration snapshot
  with the old code. Snapshots use the database's own `backup()`, never a file copy.
- The supervisor always restarts the app unless shutting down; a requested exit (code 0) is
  healthy.
- **A failed check retries from 4 minutes**, doubling to 16 hours (2026-09-26; before: 30
  minutes, too slow when the network comes back). The update page says when the next attempt
  is, offers Check now, and checks when opened after a failure.

## Puppets and displays

- **Window positioning**: `window: {x, y, width, height}`, all optional, always fullscreen.
  `--kiosk` is dropped when a window is set (kiosk ignores the position); `--test-type` always
  (it hides the "unsupported flag" infobar). `width` and `height` are accepted but documented
  as not needed. Placement works on X11 and Windows, never Wayland.
- **The fullscreen exit pop-up on positioned puppets is accepted** (2026-09-18). A fix exists
  (launch with `--kiosk`, then place and fullscreen through CDP `Browser.setWindowBounds`),
  was verified on Windows and reverted the same day. Do not re-propose unless asked.
- **The default view** (2026-09-26): a puppet without its own view shows the default view;
  with none set it is blank. It is chosen from a view's menu, and the admin marks puppets
  that follow it. Setting it does not wait for the displays to load. Rejected: removing the
  default view altogether.
- **Navigation failures are logged at ERROR by both the puppet and the orchestrator**; leave
  it (2026-09-19).
- **Process guards**: `unhandledRejection` logs and survives; `uncaughtException` logs and
  shuts down with exit code 1 within 10 seconds.

## Views and blocks

- **The block box is framework-owned**: every block is a `.wk-slot` wrapping a `.wk-block`
  whose `style` `defineBlock` injects. Size is per axis; `BlockImpl.box` only provides
  defaults. `disabled` is an authoring state, filtered in the resolver, still validated, shown
  dimmed at 0.45.
- **Block info lives on the definition** (`info: {label, description, icon}` with an icon id
  string, 2026-07-29), so plugin blocks bring their own and the block layer stays React-free.
- **The schema/render split of blocks is deferred**; triggers: plugins, backend validation,
  bundle size.
- **Dual tone is chosen through the font** (2026-09-23): `DSEG7 Classic Dual` and
  `DSEG14 Classic Dual` are the same font files under a second CSS name, and picking one draws
  the unlit segments behind the text. Rejected: a dual tone switch on the block (it only
  worked with two fonts); a COLRv1 colour font built from DSEG (a font build step; revisit
  with data sources); names with parentheses (rejected by the browser as inline styles, the
  block gets no font).
- **No schema default font on the date and time block** (2026-09-20): a schema default
  reaches saved views and breaks font inheritance. A preset applied when inserting a block is
  the right tool.
- **The seeded default view** is created only on a fresh database, never on existing
  installs, and never again once deleted (2026-09-24). v2 showed an address splash on a fresh
  install; v3 shows the Clock until the setup page exists.
- **The view status pill is red for an assigned view on purpose** (2026-09-19); it signals
  that the view is live.

## Admin

- `withToast` is the single toast owner; drafts do not own toasts or navigation guarding;
  settings rows focus on click only when opted in through `inputRef`; puppet appearance is
  runtime state, not config; the trash icon destroys, the cross dismisses.
- **Reconnect** (2026-09-24): the state stream reconnects every 2 s after any loss and the
  page reloads when the running version changes. Rejected: a backoff (one tab on a LAN needs
  none); keeping unsaved form data across an update (not worth the code).
- **The logo shows the running version** from the state; the boot splash shows only the major
  version, since a full version baked into the image goes wrong after the first update.
- **Mobile** (2026-09-26): the operator's pages first, then the rest; the block editor stays a
  desktop tool.

## Config and security

- `config.local.yaml` replaces `config.yaml` entirely when present, never merged; the tracked
  `config.yaml` is the commented example.
- **No authentication in v3.x**; revisit for a hosted deployment or a customer ask.
  Authentication and a public API are one decision.

## Documentation

- User documentation stays in the README; GitHub Pages when it grows (2026-09-19).
- Working documentation lives in `.docs/` (2026-09-26). The context file is `overview.md`,
  not a tool-specific name.
