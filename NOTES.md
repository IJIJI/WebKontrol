# NOTES

Session handoff, updated 2026-09-27. Resume from **Next**.

## Task

Get v3 to its first stable release marked GitHub latest (v3.3.1 is in its soak; soak fixes are made on `dev` in a separate session), and develop 3.4 on `next` meanwhile.

## Done

- **v3.3.0** (pre-release, 2026-09-25): seeded default view on a fresh install (the "Clock": dual tone DSEG7 clock, `l j F` date, WebKontrol wordmark with `V3` subline), dual tone segment fonts (`DSEG7 Classic Dual`, `DSEG14 Classic Dual`), the admin reconnects by itself (every 2 s) and reloads on a version change, branded boot splash and X background, the nav shows the running version, `pi-image/build.sh` derives the version from `app/package.json`, smaller logs, dependency security updates, the installer no longer prints an unusable systemd unit, block panel settings stack when narrow, README rewritten for v3 (hero GIF, Use, Config Guide, current screenshots). Fresh-card test on a Pi 4 passed (splash, default view, card growth to 29G, BOOT 512M FAT32 mounts on Windows by itself, reconnect after restart/reboot/cable pull, offline boot, update 3.3.0 -> 3.2.1 -> 3.3.0).
- **v3.3.1** (pre-release, 2026-09-26, run 36250812626 green, tarball and `WebKontrol_Pi_v3.3.1.img.zst` attached and verified): the default view is chosen from a view's menu ("Make default" / "Stop being default", `PUT /api/views/default`), the Puppets, puppet and Views pages show which displays follow it (a "Default" chip, the view no longer reads "Inactive"); a failed update check retries at 4 min doubling to 16 h, the update page says when and has Check now bottom right, and checks again when opened; the logo no longer shows `VV3.3.0` on managed installs (a managed install reports the tag with its `v`).
- **Verified by scratch boxes on Windows** for everything above; the failed-check recovery was tested end to end with a fake GitHub (recovered by the automatic retry 4 min after the first failure, no clicks).

## In progress

Nothing in code. `dev` and `next` are both at `4952e13`: `84af711` (Version 3.3.1) plus the four docs commits that created `.docs/`. `main` is at the 3.3.1 merge.

Pending outside code:
- **Soak on 3.3.1**: day 2 on 2026-09-27, clean so far. Setup and daily checks are in `.docs/todo.md` (Soak).
- **Stable after a clean soak**: 3.3.1 as is (or 3.3.2 with soak fixes); the README drops `--version` in the same commit as the bump; published WITHOUT the pre-release flag.

## Branches

Settled, see `.docs/overview.md` (Branches): `dev` is the 3.3.x release line, `next` holds 3.4, fixes flow forward `dev` to `next`. `.docs/` changes go on `next`; a fix on `dev` carries only its own doc lines.

## Dead ends

- **Tagging before the release PR was merged**: v3.3.0's first tag sat on a `main` still at v3.2.1; CI refused the version mismatch. Merge the PR first, check `git show origin/main:app/package.json | grep version`, then tag. A release must be deleted and re-created to rerun the workflow.
- **A stylesheet fix for the narrow block panel** (flex-wrap on `.setting.field`) broke the COMPACT rows. The design already had `SettingWidth.AUTO` via `SettingWidthContext`; the block panel just did not opt in.
- **A dual tone switch on blocks** only worked with two fonts and felt wrong; dual tone is chosen through the font family instead. Font names with parentheses are rejected as inline styles (the block gets no font at all), hence `DSEG7 Classic Dual`.
- **A DSEG14 default font on the datetime block** was rejected: a schema default reaches saved views (changes existing clocks) and breaks font inheritance. The right tool is an insert-time preset (backlog).
- **Checking the nav version only on an unmanaged box** hid the `VV` bug: test version-dependent UI on a managed scratch box (a `current` file in the working dir).
- **Recording the README GIF with three pages in one headless browser** stalled screenshots for minutes (background tabs are throttled): one browser per page. Real `mouse.move` was seconds per step: record the pointer position per frame and draw it. One shared palette cut the GIF from 3 MB to 1 MB.
- **`webkontrol.local` did not resolve** on the user's network during the 3.3.0 test (it did on 2026-09-19): probably the network blocking mDNS multicast; `systemctl status avahi-daemon` on the Pi to rule the Pi out.

## Testing recipes

- **Scratch box** (never touches the dev database): a temp dir with `config/config.local.yaml` (`web.port: 8080`, own puppets or `puppets: []`), run `node <repo>/app/dist/app.js` from that dir after `yarn build`. Add a file `current` containing `v3.3.1` to make it a managed install (update checker on). Set `update.api_base: http://127.0.0.1:9999` for a failing check; a one-line node http server on 9999 answering `[]` (404 on `/releases/latest`) simulates GitHub coming back.
- **Fresh install**: a new scratch dir seeds the Clock view and makes it the default.
- **Puppeteer** from `app/node_modules/puppeteer` for screenshots and clicks; view pages hold an SSE stream, so wait for `load` or `domcontentloaded`, never `networkidle0`.

## Where things live

- Everything lasting is in `.docs/` (start at `overview.md`): todo, backlog, decisions, conventions, architecture, the release runbook with the testing recipes, and the Pi image.
- Working rules: consult before every code change, review passes plus a commit list after every piece, the user does all git, `git add` and `git commit` as separate commands with paths from `app/`, no em dashes, no AI traces anywhere.
- Release checklist: package.json equals the tag, README pin updated, PR merged before tagging, `yarn typecheck` and `yarn check` green, hardware test of what changed, an installer run when `install.mjs` changed, notes in the v3.0.0 style.

## Next

The user picks the backlog items that join 3.4 (a candidate list was given 2026-09-27). Then the 3.4 plan on `next`, from `.docs/todo.md`: the width assessment, the tablet-first admin, more units on style fields, `build.sh` defaulting to GitHub latest, and the puppet runtime fields (backlog).
