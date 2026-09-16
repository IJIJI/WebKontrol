#!/bin/bash
# ---------------------------------------------------------------------------
# Build the WebKontrol Raspberry Pi image with rpi-image-gen
# (https://github.com/raspberrypi/rpi-image-gen).
#
# Run from WSL2 or any Debian/Ubuntu host (the repo may stay on the Windows filesystem):
#   bash /mnt/c/path/to/WebKontrol/pi-image/build.sh v3.1.0
#
# The argument is the WebKontrol release tag baked into the image; it must carry an
# update tarball. An optional GITHUB_TOKEN in the environment is handed to the installer
# for its API call (CI runners are rate-limited without one).
#
# Output: ${WORK_DIR}/work/image-WebKontrol_Pi/WebKontrol_Pi.img.xz
# ---------------------------------------------------------------------------
set -euo pipefail

VERSION="${1:?usage: build.sh <release tag, e.g. v3.1.0>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
sudo apt-get install -y --no-install-recommends qemu-user-static binfmt-support gettext-base xz-utils > /dev/null
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
# One .xz for distribution, named for the release page.
# ---------------------------------------------------------------------------
IMG_DIR="${WORK_DIR}/work/image-WebKontrol_Pi"
RAW_IMG="$(ls "${IMG_DIR}"/*.img 2>/dev/null | head -1 || true)"
ZST_IMG="$(ls "${IMG_DIR}"/*.img.zst 2>/dev/null | head -1 || true)"
if [ -z "${RAW_IMG}" ] && [ -n "${ZST_IMG}" ]; then
    zstd -d -f "${ZST_IMG}" -o "${ZST_IMG%.zst}"
    rm -f "${ZST_IMG}"
    RAW_IMG="${ZST_IMG%.zst}"
fi
[ -n "${RAW_IMG}" ] || { echo "ERROR: no .img or .img.zst in ${IMG_DIR}" >&2; exit 1; }

echo "==> Compressing..."
mv -f "${RAW_IMG}" "${IMG_DIR}/WebKontrol_Pi.img"
xz -T0 -6 -f "${IMG_DIR}/WebKontrol_Pi.img"

echo ""
echo "==> Done: ${IMG_DIR}/WebKontrol_Pi.img.xz"
