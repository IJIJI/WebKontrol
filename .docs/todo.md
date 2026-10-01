# Todo

Work with a set moment, in order. Work with no moment yet is in [backlog.md](backlog.md).
Entry: moment, what, done when, notes. A finished entry is removed.

## Now: stable 3.x

### Stable release
*Moment:* now; the soak passed on 2026-10-01.
*What:* 3.3.1 as is (the soak needed no fixes), published without the pre-release flag so
GitHub marks it latest and every v3 box is offered it.
*Done when:* released and a box updated to it. See [release.md](release.md), "Before the
first stable release".
*Notes:* the soak ran on 3.3.1 from 2026-09-27 on a Pi 4 with one screen: three power pulls
(2026-09-29 and twice on 2026-09-30), no problems seen afterwards; no warnings in the app log
beyond the update restarts and two failed boot-time update checks from before the soak;
memory flat (671 MB used after three days up, 641 MB on the last day); logs 372K. The release
work is done on `dev` in a separate session. Checked 2026-10-01: the audit shows only the
accepted findings; `pi-image/` and `install.mjs` are unchanged since v3.3.0, so no new
fresh-card test is needed. Never tested yet: the installer without `--version`, and a real
"latest" announcement on a box; both only work once the release is latest.

## On `next`, for 3.4 (during the soak)

### Width assessment
*Moment:* first on `next`. No code.
*What:* every admin page at iPad widths, on a small laptop and on a phone: screenshots and a
list of what breaks and why.
*Done when:* the admin item below is sized from it.

### Tablet-first admin
*What:* iPads and smaller laptops first; phones (all sizes) are supported one level below
(2026-09-27). Step 1, the operator's pages (Puppets status and assign, Views list, assign and
share, a view's and a puppet's page, updates); step 2, the rest (settings, modals,
navigation). The block editor stays desktop and says so on a phone.
*Done when:* those pages work well on tablets and small laptops, and are usable on phones.
*Notes:* the viewport height likely moves to `dvh`. The setup page's QR code (backlog)
depends on phone support.

### More units on style fields
*What:* font size, letter spacing, word spacing and more fields accept vw/vh, em and %
besides px, through the shared UnitInput control (backlog, Settings and fields).
*Done when:* the fields take units and the seeded Clock view's px sizes are revisited.
*Notes:* the fields get the same number-and-unit UX as the other unit fields (2026-09-27).

### `build.sh` defaults to GitHub latest
*What:* without an argument, `pi-image/build.sh` asks the releases API for the latest tag
(`GITHUB_TOKEN` when set) instead of reading `app/package.json`.
*Done when:* a local build without an argument builds the latest release.
*Notes:* the tag is still needed up front (the image file name and the layer's required
variable). CI keeps passing the release tag explicitly.

## For the maintainer

- Delete the history-rewrite backup refs from 2026-09-19 (four are left under
  `refs/original`; from `app/`, PowerShell):
  `git for-each-ref --format="%(refname)" refs/original | ForEach-Object { git update-ref -d $_ }`
