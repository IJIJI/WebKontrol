#!/bin/bash
# ---------------------------------------------------------------------------
# Build the WebKontrol Raspberry Pi image with rpi-image-gen
# (https://github.com/raspberrypi/rpi-image-gen).
#
# Run from WSL2 or any Debian/Ubuntu host (the repo may stay on the Windows filesystem):
#   bash /mnt/c/path/to/WebKontrol/pi-image/build.sh [v3.2.0]
#
# The argument is the WebKontrol release tag baked into the image; it must carry an
# update tarball. Without one, the version in app/package.json is used, so a checkout
# builds the image of its own release. An optional GITHUB_TOKEN in the environment is
# handed to the installer for its API call (CI runners are rate-limited without one).
#
# Output: ${WORK_DIR}/WebKontrol_Pi_<tag>.img.zst (a link into the engine's deploy directory)
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# The argument, else app/package.json's version: the only place a version is typed by hand.
# CI always passes the release tag.
VERSION="${1:-v$(sed -n 's/^  "version": "\([^"]*\)".*/\1/p' "${SCRIPT_DIR}/../app/package.json")}"
[ "${VERSION}" != "v" ] || { echo "build.sh: no release tag given and none found in app/package.json" >&2; exit 1; }
WORK_DIR="${WORK_DIR:-${HOME}/webkontrol-image-work}"
RIG_DIR="${WORK_DIR}/.rpi-image-gen"
RIG_REPO="https://github.com/raspberrypi/rpi-image-gen.git"
# Pinned: layer names have changed under HEAD before (a user layer rename broke builds
# that tracked main). Bump deliberately, then rebuild and re-test.
RIG_COMMIT="89f5e5d"

# ---------------------------------------------------------------------------
# rpi-image-gen at the pinned commit (its install_deps.sh lives inside the clone).
# ---------------------------------------------------------------------------
mkdir -p "${WORK_DIR}"
if [ ! -d "${RIG_DIR}" ]; then
    echo "==> Cloning rpi-image-gen..."
    git clone "${RIG_REPO}" "${RIG_DIR}"
fi
git -C "${RIG_DIR}" fetch -q origin
git -C "${RIG_DIR}" checkout -q "${RIG_COMMIT}"

# ---------------------------------------------------------------------------
# Dependencies: rpi-image-gen's own script knows the list and is idempotent. QEMU and
# binfmt run the arm64 chroot steps (corepack, the installer, systemctl enable).
# ---------------------------------------------------------------------------
echo "==> Installing dependencies..."
sudo apt-get install -y --no-install-recommends qemu-user-static binfmt-support gettext-base > /dev/null
sudo "${RIG_DIR}/install_deps.sh"
sudo update-binfmts --enable qemu-aarch64 2>/dev/null || true
sudo modprobe nbd 2>/dev/null || echo "    WARNING: nbd module unavailable, image creation may fail on WSL2"

# ---------------------------------------------------------------------------
# Previous build's root-owned chroot cannot be removed by bdebstrap's own --force.
# ---------------------------------------------------------------------------
echo "==> Cleaning previous build artifacts..."
sudo rm -rf "${WORK_DIR}/work"
mkdir -p "${WORK_DIR}/work"

# ---------------------------------------------------------------------------
# Build. -S makes config/webkontrol.yaml and layer/webkontrol.yaml findable; the trailing
# assignments override config values (the release tag, the optional token).
# ---------------------------------------------------------------------------
echo "==> Building WebKontrol ${VERSION} image..."
"${RIG_DIR}/rpi-image-gen" build \
    -S "${SCRIPT_DIR}" \
    -c webkontrol.yaml \
    -B "${WORK_DIR}/work" \
    -- "IGconf_webkontrol_version=${VERSION}" "IGconf_webkontrol_github_token=${GITHUB_TOKEN:-}"

# ---------------------------------------------------------------------------
# The engine already compresses the image into its deploy directory (zstd, which
# Raspberry Pi Imager flashes directly); the raw .img beside it in image-WebKontrol_Pi/
# is the uncompressed original. One path for CI and for hand-flashing, named with the
# release so downloads stay distinguishable:
# ---------------------------------------------------------------------------
IMG="$(ls -t "${WORK_DIR}"/work/deploy-*/WebKontrol_Pi.img.zst 2>/dev/null | head -1 || true)"
[ -n "${IMG}" ] || { echo "ERROR: no WebKontrol_Pi.img.zst under ${WORK_DIR}/work/deploy-*" >&2; exit 1; }
OUT="${WORK_DIR}/WebKontrol_Pi_${VERSION}.img.zst"
ln -sf "${IMG}" "${OUT}"

echo ""
echo "==> Done: ${OUT}  ->  ${IMG}"
