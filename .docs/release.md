# Releases and testing

## Before every release (pre-releases included)

- `app/package.json`'s version equals the tag; the README install line pins it while only
  pre-releases exist.
- `yarn typecheck` and `yarn check` pass (CI enforces them; lint is informational).
- `yarn npm audit --all --recursive` is reviewed.
- What changed is tested where it runs: Windows and/or the Pi; a fresh-card test when
  `pi-image/` changed; an installer run when `install.mjs` changed.
- Release notes follow the earlier ones: one opening paragraph, a caution while it is a
  pre-release, "What is new", "Fixed" when there is anything, "Install".

## Releasing

1. Commit the version bump on `dev` (`package.json` and the README pin in one commit).
2. Open the pull request `dev` to `main` and **merge it first**.
3. Check that `main` carries the new version before tagging:
   `git show origin/main:app/package.json | grep version`.
4. Tag `vX.Y.Z` on `main`, publish the release on GitHub with the notes. Title:
   `vX.Y.Z - <short text>`. Mark it pre-release while it is one.
5. The workflow attaches `webkontrol-vX.Y.Z.tar.gz` (the release job, about 1 minute) and
   `WebKontrol_Pi_vX.Y.Z.img.zst` (the image job, about 25 minutes).
6. Verify: both assets attached, the tarball's `package.json` says the new version. Update a
   running box from the admin; flash the image when `pi-image/` changed.
7. Merge `dev` forward into `next`.

The workflow attaches assets only on a published release. To rerun it for a release, delete
the release and its tag and publish again. A manual run (`workflow_dispatch` with a tag)
builds the image for an existing release as a workflow artifact, not on the release.

## Before the first stable release

- Everything above, plus a soak: the image and a Windows install running for days without new
  bugs, and the update path proven box to box across at least one pre-release.
- The README drops `--version` from the install command in the same commit as the version
  bump. The release is published without the pre-release flag.
- The notes say that v2 users need a fresh install (no config or database carries over).

## Testing recipes

### A scratch box
Never touches the development database. After `yarn build`, make a directory with
`config/config.local.yaml` (for example `web.port: 8080` and your own puppets, or
`puppets: []` for no browser windows) and run from that directory:
`node <repo>/app/dist/app.js`. A new directory is a fresh install: it seeds the Clock view.

### A managed scratch box
Add a file `current` containing a tag (`v3.3.1`) to the directory: the app then behaves as an
installed system, with the update checker on and the version reported as the tag. Use this for
anything version- or update-dependent (the `VV3.3.0` bug only showed on a managed box).

### A failing and a recovering update check
Set `update.api_base: http://127.0.0.1:9999` in the scratch config: every check fails. To
bring the "network" back, run a fake GitHub on that port:
`node -e 'require("http").createServer((q,r)=>{r.setHeader("content-type","application/json");if(q.url.includes("/releases/latest")){r.statusCode=404;r.end("{}")}else r.end("[]")}).listen(9999)'`

### Browser automation
Puppeteer from `app/node_modules`. View pages hold an SSE stream: wait for `load` or
`domcontentloaded`, never `networkidle0`. Several pages that must keep rendering need one
headless browser each: a browser throttles pages that are not in front, and screenshots of
them stall. `boundingBox()` is relative to the viewport; for crops, screenshot the viewport.

### The README hero GIF
Recorded once, not part of the repo. Three headless browsers (the admin and two display
mirrors), frames taken while a script clicks through the admin, the pointer position recorded
per frame and drawn afterwards (real mouse moves were seconds per step), the website display
captured as one still per navigation, the admin's moving background off (`disableBackground`
through `PATCH /api/config/ui`). Composed with Pillow using one shared palette for all frames
(per-frame palettes tripled the file).

## Dead ends

- **Tagging before the release PR was merged**: v3.3.0's first tag sat on a `main` still at
  3.2.1, and CI refused the version mismatch.
- **`git filter-branch` over all branches rewrote the whole history**: it strips GitHub's
  signature from web merges, so every descendant got a new id. Limit it to the commits that
  must change (`-- <refs> ^<parent-of-first> ^<last-untouched-tag>`), from the repo root.
- **PowerShell pipes into `git update-ref --stdin` fail**; call `git update-ref` per ref.
