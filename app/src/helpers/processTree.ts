import { execFileSync, type ChildProcess } from "node:child_process";

/**
 * Make sure a spawned process and its children are gone. The tree matters: Chromium's
 * renderer and GPU processes (and on Windows any child) outlive a plain parent kill, which
 * is how a dead puppet leaves a kiosk window on the display with nothing driving it.
 *
 * Owns only the platform mechanics; callers own their logging (a puppet warns about an
 * outlived browser, the supervisor about an app that ignored its stop).
 *
 * @returns true when a kill was actually issued; false when there was nothing to kill
 *   (no process, or it already exited), so callers can log only the real event.
 */
export function killProcessTree(proc: ChildProcess | null): boolean {
  if (!proc?.pid || proc.exitCode !== null || proc.signalCode !== null) return false;

  try {
    if (process.platform === "win32") {
      // /T takes the tree, /F skips asking; Windows has no process groups to lean on.
      execFileSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      // Detached spawns lead their own process group; the negated pid takes the group.
      process.kill(-proc.pid, "SIGKILL");
    }
  } catch {
    // Missing permissions, a pid that exited in between, or no group to speak of. The
    // plain kill leaves grandchildren behind, but the process itself still goes.
    proc.kill("SIGKILL");
  }
  return true;
}
