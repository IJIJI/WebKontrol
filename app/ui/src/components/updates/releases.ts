import { isNewerVersion } from "../../../../src/system/update/version";
import type { Release, UpdateInfo } from "../../../../src/system/update/model";

/**
 * The newest flagged pre-release beyond what runs, for the quiet mention. Derived here
 * rather than shipped as its own field: the flag already sits on each release, and the
 * list arrives newest first, so the first match is the answer. Several pre-releases can
 * coexist in the list (each wears its pill); only the newest gets mentioned.
 */
export function newestPrerelease(info: UpdateInfo): Release | undefined {
  return info.releases.find(
    (release) => release.prerelease && isNewerVersion(release.version, info.current),
  );
}
