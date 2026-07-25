import { existsSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { inHome } from '../manifest.mjs'
import { walk, skillEntries, c } from '../fsutil.mjs'
import { packOf } from '../packs.mjs'

/**
 * Do the refs in the INSTALLED skills resolve in this $HOME?
 *
 * Distinct from checkPayloadPaths, which asks a repo question: does the payload
 * reference what the payload ships (the fresh-clone case). This asks a live-state
 * question: given what is actually linked here, can an agent follow the instructions
 * it has been given.
 *
 * The two must not both scan `~/.agents/skill*`, or a narrow install produces the same
 * complaint twice — and the payload-side version produced 191 lines for one
 * `--packs=core` install, which is indistinguishable from noise. That check now leaves
 * this namespace alone.
 *
 * Output is grouped by owning pack and names the command that fixes it, because
 * "86 things are broken" is not actionable and "add --packs=video" is.
 */

const REF = /~\/\.agents\/(skills|skill-modules)\/([A-Za-z0-9._-]+)/g
const TEXT = new Set(['.md', '.txt'])

export function checkInstalledRefs({ fail, warn, info }) {
  const root = inHome('.agents/skills')
  const installed = skillEntries(root)
  if (!installed.length) return { refs: 0, dangling: 0 }

  let refs = 0
  // module -> { pack, from:Set<skill> }
  const missing = new Map()

  for (const e of installed) {
    for (const [abs] of walk(join(root, e.name))) {
      if (!TEXT.has(extname(abs))) continue
      let text
      try { text = readFileSync(abs, 'utf8') } catch { continue }
      for (const [, tree, name] of text.matchAll(REF)) {
        if (/[<>${}*]/.test(name)) continue          // template placeholder, not a real module
        refs++
        // existsSync follows the link, so a link to a pruned target reads as absent —
        // which is what we want: a dangling link is as broken as no link.
        if (existsSync(inHome(join('.agents', tree, name)))) continue
        if (!missing.has(name)) missing.set(name, { pack: packOf(name), from: new Set() })
        missing.get(name).from.add(e.name)
      }
    }
  }

  if (!missing.size) {
    info(`${refs} skill cross-references in ${installed.length} installed skills all resolve`)
    return { refs, dangling: 0 }
  }

  // Group by pack: one line per pack beats one line per broken module.
  const byPack = new Map()
  for (const [mod, { pack }] of missing) {
    const key = pack ?? 'no pack — orphaned module'
    if (!byPack.has(key)) byPack.set(key, [])
    byPack.get(key).push(mod)
  }
  const ordered = [...byPack].sort((a, b) => b[1].length - a[1].length)

  // A partial install is a legitimate choice, so this is a warning, not a failure —
  // except for modules no pack claims, which can only mean the payload is inconsistent.
  const orphaned = byPack.get('no pack — orphaned module') ?? []
  const fixable = ordered.filter(([k]) => k !== 'no pack — orphaned module')

  if (fixable.length) {
    const packs = fixable.map(([p]) => p)
    warn(
      `${missing.size - orphaned.length} module reference(s) in your installed skills do not resolve — ` +
      `this looks like a partial install. Fix: ${c.bold(`beast install --packs=${packs.join(',')}`)}`,
    )
    for (const [pack, mods] of fixable) {
      const sample = mods.slice(0, 4).join(', ') + (mods.length > 4 ? `, +${mods.length - 4} more` : '')
      const from = [...new Set(mods.flatMap((m) => [...missing.get(m).from]))].slice(0, 3).join(', ')
      info(`  ${String(mods.length).padStart(3)} from pack ${pack}: ${sample}  ${c.dim(`(referenced by ${from})`)}`)
    }
  }

  if (orphaned.length) {
    fail(
      `${orphaned.length} reference(s) point at modules no pack provides — the payload is inconsistent: ` +
      orphaned.slice(0, 6).join(', '),
    )
  }

  return { refs, dangling: missing.size }
}
