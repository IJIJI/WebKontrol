# Todo

Work with a set moment, in order. Work with no moment yet is in [backlog.md](backlog.md).
Entry: moment, what, done when, notes. A finished entry is removed.

## Now: stable 3.x

### Update the test Pi to 3.3.1
*Moment:* before the soak.
*What:* update from 3.3.0 in the admin (Config, Releases).
*Done when:* the logo reads `V3.3.1` (not `VV`), the Puppets page shows the Default chips, the
Clock's menu offers "Stop being default", and the page came back by itself after the update.

### Soak
*Moment:* from 2026-09-27, four days, on 3.3.1.
*What:* the Pi runs unattended. HDMI shows the Ontime website view, the touch display the
Clock, both assigned explicitly. Day 2: one reboot and one cable pull.
*Done when:* four days without new bugs. Daily: the screens are right, the admin loads without
a refresh, and over SSH
`journalctl -u webkontrol --since yesterday -p warning --no-pager | tail -20`, `free -m` and
`du -sh /opt/webkontrol/logs` look unremarkable (memory flat, logs growing slowly).
*Notes:* a Windows v3.3.x install alongside, if a machine can stay on.

### Phone-width assessment
*Moment:* during the soak. No code.
*What:* every admin page at 390 px wide: screenshots and a list of what breaks and why.
*Done when:* the mobile item below is sized from it.

### Stable release
*Moment:* after a clean soak.
*What:* 3.3.1 as is, or 3.3.2 with soak fixes, published without the pre-release flag so
GitHub marks it latest and every v3 box is offered it.
*Done when:* released and a box updated to it. See [release.md](release.md), "Before the
first stable release".

## Right after stable, on `next`

### Mobile-friendly admin
*What:* step 1, the operator's pages on a phone (Puppets status and assign, Views list,
assign and share, a view's and a puppet's page, updates); step 2, the rest (settings, modals,
navigation). The block editor stays desktop and says so on a phone.
*Done when:* those pages work at 390 px.
*Notes:* the setup page's QR code (backlog) depends on it.

### More units on style fields
*What:* font size, letter spacing, word spacing and more fields accept vw/vh, em and %
besides px, through the shared UnitInput control (backlog, Settings and fields).
*Done when:* the fields take units and the seeded Clock view's px sizes are revisited.

### `build.sh` defaults to GitHub latest
*What:* without an argument, `pi-image/build.sh` asks the releases API for the latest tag
(`GITHUB_TOKEN` when set) instead of reading `app/package.json`.
*Done when:* a local build without an argument builds the latest release.
*Notes:* the tag is still needed up front (the image file name and the layer's required
variable). CI keeps passing the release tag explicitly.

## For the maintainer

- If not done yet: delete the history-rewrite backup refs from 2026-09-19 (from `app/`,
  PowerShell):
  `git for-each-ref --format="%(refname)" refs/original | ForEach-Object { git update-ref -d $_ }`
