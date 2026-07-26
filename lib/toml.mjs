// One TOML reader for the whole tool.
//
// Node has no TOML parser and beast takes no dependencies, so borrow python3's
// stdlib tomllib and move the result across as JSON. A hand-rolled line reader
// would have to understand inline tables, arrays-of-tables and multi-line arrays
// — all of which appear in a real config.toml.
//
// This lived inside lib/checks/config.mjs until the config writer needed the same
// parse. Two copies of "how do we read TOML" is exactly the drift beast exists to
// stop, so there is one copy and both callers import it.

import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { IS_WINDOWS } from './platform.mjs'

const TOML_TO_JSON = 'import json,sys,tomllib\nwith open(sys.argv[1],"rb") as f: json.dump(tomllib.load(f),sys.stdout,default=str)'

// tomllib is stdlib from Python 3.11. Older interpreters raise ModuleNotFoundError,
// which surfaces as 'no-python' rather than as a bogus "your config is broken".
const PROBE = 'import tomllib'

let cached                                   // null once probed and unavailable

/**
 * Path to an interpreter that can parse TOML, or null.
 *
 * Windows ships `python` far more often than `python3`, and on macOS `python` may be
 * a 2.7 stub, so try both and let the tomllib probe decide.
 */
export function tomlInterpreter() {
  if (cached !== undefined) return cached
  for (const bin of IS_WINDOWS ? ['python', 'python3'] : ['python3', 'python']) {
    try {
      execFileSync(bin, ['-c', PROBE], { stdio: 'ignore' })
      return (cached = bin)
    } catch { /* try the next one */ }
  }
  return (cached = null)
}

/** Test seam: forget the probe result. */
export const resetTomlInterpreter = () => { cached = undefined }

/**
 * Parse a TOML file.
 *
 * Never throws. The three failure modes are deliberately distinct, because the
 * callers treat them differently: a missing file is normal, a missing interpreter
 * means "cannot check, do not guess", and invalid TOML is a real defect the harness
 * reports as silence.
 *
 *   { ok: true,  value }
 *   { ok: false, code: 'missing' | 'no-python' | 'invalid', detail }
 */
export function parseTomlFile(file) {
  if (!existsSync(file)) return { ok: false, code: 'missing' }
  const python = tomlInterpreter()
  if (!python) return { ok: false, code: 'no-python' }
  try {
    return { ok: true, value: JSON.parse(execFileSync(python, ['-c', TOML_TO_JSON, file], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    })) }
  } catch (err) {
    const detail = String(err.stderr ?? err.message).trim().split('\n').pop()
    return { ok: false, code: 'invalid', detail }
  }
}
