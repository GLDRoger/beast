// Single source for every OS-dependent fact. Nothing else in the CLI should
// branch on process.platform — if a new difference shows up, it lands here.

import { homedir, platform } from 'node:os'
import { readFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

export const IS_WINDOWS = platform() === 'win32'
const IS_MAC = platform() === 'darwin'

/**
 * Always use this, never process.env.HOME. On Windows there is no HOME — the
 * variable is USERPROFILE — so reading process.env.HOME yields undefined and
 * anything taking it as a path argument throws ERR_INVALID_ARG_TYPE.
 * os.homedir() resolves correctly on all three platforms.
 */
export const HOME = homedir()

/**
 * Detect WSL. Returns null on real Linux/macOS/Windows, else { version, distro }.
 *
 * WSL is Linux, so the installer runs natively — but two things silently break
 * there, and both need a warning rather than a code path (see doctor).
 */
/**
 * Pure half of WSL detection, split out so it is testable without a WSL machine.
 * `release` is the contents of /proc/sys/kernel/osrelease (or /proc/version).
 *
 * WSL2 reports e.g. "5.15.146.1-microsoft-standard-WSL2".
 * WSL1 reports    e.g. "4.4.0-19041-Microsoft" — no "WSL" marker at all.
 * WSL_INTEROP exists only under WSL2, so it disambiguates when the string does not.
 */
export function parseWslRelease(release, env = {}) {
  const lower = (release ?? '').toLowerCase()
  if (!lower.includes('microsoft') && !lower.includes('wsl')) return null
  const version = lower.includes('wsl2') || env.WSL_INTEROP ? 2 : 1
  return { version, distro: env.WSL_DISTRO_NAME ?? 'unknown' }
}

export function detectWsl() {
  if (IS_WINDOWS || IS_MAC) return null
  let release = ''
  for (const f of ['/proc/sys/kernel/osrelease', '/proc/version']) {
    try { release = readFileSync(f, 'utf8'); if (release) break } catch { /* keep trying */ }
  }
  return parseWslRelease(release, process.env)
}

/** True when a path sits on a Windows drive mounted into WSL (DrvFs). */
export const isDrvFs = (p) => /^\/mnt\/[a-z]\//i.test(p)

/**
 * Resolve a binary on PATH, or null. `command -v` is a POSIX shell builtin and
 * does not exist in cmd.exe; Windows needs `where`.
 * Returns the resolved path so callers can tell a WSL-native binary from a
 * Windows .exe reached through interop.
 */
export function whichBinary(bin) {
  // No `shell: true` with an args array — Node 24 deprecates it (DEP0190) because
  // the args are concatenated unescaped. `where.exe` is a real binary so it needs
  // no shell; on POSIX we invoke sh explicitly and keep the args separated.
  const [cmd, args] = IS_WINDOWS
    ? ['where', [bin]]
    : ['/bin/sh', ['-c', `command -v -- "$1"`, 'sh', bin]]
  try {
    const out = execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return out.split(/\r?\n/).find((l) => l.trim()) ?? null
  } catch {
    return null
  }
}

/**
 * The `type` argument for fs.symlinkSync. Ignored on POSIX; on Windows it decides
 * whether the call even succeeds:
 *   - 'junction' for directories — works WITHOUT Developer Mode or admin
 *   - 'file' for files — still requires Developer Mode or elevation
 * Passing nothing makes Windows assume 'file', so every directory link fails.
 */
export function symlinkType(target) {
  if (!IS_WINDOWS) return undefined
  try { return statSync(target).isDirectory() ? 'junction' : 'file' } catch { return 'file' }
}

/**
 * Windows junctions cannot be relative — they store an absolute target. So the
 * repo-internal links `beast skills add` creates must be absolute on Windows,
 * which means a Windows clone needs `beast skills` re-run if the repo moves.
 * POSIX keeps relative links so the repo stays portable.
 */
export const wantsAbsoluteInternalLinks = IS_WINDOWS

export const describePlatform = () => {
  const wsl = detectWsl()
  if (wsl) return `WSL${wsl.version} (${wsl.distro})`
  return IS_WINDOWS ? 'Windows' : IS_MAC ? 'macOS' : 'Linux'
}
