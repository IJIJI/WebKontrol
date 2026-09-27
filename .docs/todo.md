# Todo

Work with a set moment, in order. Work with no moment yet is in [backlog.md](backlog.md).
Entry: moment, what, done when, notes. A finished entry is removed.

## Now: stable 3.x

### Soak
*Moment:* running, four days on 3.3.1; day 2 on 2026-09-27, clean so far.
*What:* the Pi runs unattended. HDMI shows the Ontime website view, the touch display the
Clock, both assigned explicitly. Day 2: one reboot and one cable pull.
*Done when:* four days without new bugs. Daily: the screens are right, the admin loads without
a refresh, and over SSH
`journalctl -u webkontrol --since yesterday -p warning --no-pager | tail -20`, `free -m` and
`du -sh /opt/webkontrol/logs` look unremarkable (memory flat, logs growing slowly).
*Notes:* a Windows v3.3.x install alongside, if a machine can stay on. Soak fixes are made on
`dev` in a separate session.

### Stable release
*Moment:* after a clean soak.
*What:* 3.3.1 as is, or 3.3.2 with soak fixes, published without the pre-release flag so
GitHub marks it latest and every v3 box is offered it.
*Done when:* released and a box updated to it. See [release.md](release.md), "Before the
first stable release".

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
