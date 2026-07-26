#!/usr/bin/env node
import { install } from '../lib/install.mjs'
import { doctor } from '../lib/doctor.mjs'
import { scan } from '../lib/scan.mjs'
import { list, add, rm } from '../lib/skills.mjs'
import { c } from '../lib/fsutil.mjs'
import { HARNESSES, HARNESS_NAMES } from '../lib/manifest.mjs'
import { PACKS, PACK_NAMES, REQUIRED_PACKS } from '../lib/packs.mjs'
import { whichBinary } from '../lib/platform.mjs'
import { isInteractive, multiselect, confirm } from '../lib/prompt.mjs'
import { coverageWarning } from '../lib/coverage.mjs'

const USAGE = `${c.bold('beast')} — install one agent config across Claude Code, Codex, and Grok

  beast install                interactive: pick harnesses, then skill packs
  beast install --all          everything, no prompts
  beast install --harness=claude,codex --packs=core,design
  beast install --dry-run      show every link without touching anything
  beast scan                   list every skill source and how to retire each
  beast doctor                 verify links, config, skill budget, secrets
  beast skills                 list the active set
  beast skills add <name>      activate a module from the library
  beast skills rm <name>       deactivate a skill

  harnesses: ${HARNESS_NAMES.join(', ')}
  packs:     ${PACK_NAMES.join(', ')}   ${c.dim('(core is always included)')}

Config that holds your own state (settings.json, config.toml) ships as .example
and is never written for you. See README.md.`

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const valueOf = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3).split(',').map((s) => s.trim()).filter(Boolean) : null
}

/** Ask which harnesses and packs, preselecting what looks already present. */
async function chooseInteractively() {
  console.log(`\n${c.bold('beast install')}\n`)

  const harnessOpts = HARNESS_NAMES.map((n) => {
    const found = whichBinary(HARNESSES[n].bin)
    return {
      value: n,
      label: HARNESSES[n].label,
      // Preselecting only what is installed avoids linking config for a CLI the
      // user does not have — the commonest way to end up with dead config.
      hint: found ? `${HARNESSES[n].hint}  ${c.green('· found')}` : `${HARNESSES[n].hint}  ${c.dim('· not on PATH')}`,
      present: Boolean(found),
    }
  })
  const present = harnessOpts.filter((o) => o.present).map((o) => o.value)

  console.log(`  ${c.yellow('Plan tiers matter.')} beast runs long sessions with sub-agents and a`)
  console.log('  large skill context, so it burns quota fast. On $20/month tiers,')
  console.log('  Anthropic Pro especially, expect to hit limits quickly. Higher tiers')
  console.log('  are strongly recommended.')
  console.log(c.dim('  Reference setup: $200 Codex, $100 Anthropic, $20 Grok (free with X Premium).\n'))
  console.log(c.dim('  Only the tools you select are configured, and only those are offered'))
  console.log(c.dim('  as delegation targets in the prompts.\n'))
  const targets = await multiselect('Which of these do you have access to?', harnessOpts, {
    preselected: present.length ? present : HARNESS_NAMES,
  })
  console.log()

  const packOpts = PACK_NAMES.map((n) => ({
    value: n,
    label: `${PACKS[n].label}${PACKS[n].required ? c.dim(' (always)') : ''}`,
    hint: `${PACKS[n].skills.length} skills · ${PACKS[n].hint}`,
  }))

  const packs = await multiselect('Which skill packs?', packOpts, { preselected: PACK_NAMES })
  console.log()

  // Say this BEFORE the confirm, not after the install. The whole point of asking is
  // that the user can still change their mind.
  const cov = coverageWarning(packs)
  if (cov) {
    console.log(`${c.yellow('note')}  ${cov.total} module reference(s) in the skills you selected will not resolve:`)
    for (const [pack, mods] of cov.byPack) console.log(`        ${String(mods.length).padStart(3)} from ${pack}`)
    console.log(c.dim('        those entries stay listed in the routers but are dead\n'))
  }
  return { targets, packs }
}

async function runInstall() {
  const dryRun = has('--dry-run')
  let targets = valueOf('harness')
  let packs = valueOf('packs')

  const bad = [
    ...(targets ?? []).filter((t) => !HARNESS_NAMES.includes(t)).map((t) => `harness "${t}"`),
    ...(packs ?? []).filter((p) => !PACK_NAMES.includes(p)).map((p) => `pack "${p}"`),
  ]
  if (bad.length) {
    console.error(c.red(`unknown ${bad.join(', ')}`))
    console.error(`harnesses: ${HARNESS_NAMES.join(', ')}\npacks: ${PACK_NAMES.join(', ')}`)
    return 1
  }

  const explicit = targets || packs || has('--all')
  if (!explicit) {
    if (!isInteractive()) {
      // Piped or CI: prompting would hang forever, so state the assumption and go.
      console.log(c.dim('non-interactive: installing everything (pass --harness/--packs to narrow)'))
    } else {
      const chosen = await chooseInteractively()
      targets = chosen.targets
      packs = chosen.packs
      const summary = `${targets.join(', ')} · packs: ${packs.join(', ')}`
      if (!dryRun && !(await confirm(`Install for ${summary}?`))) {
        console.log(c.dim('\ncancelled'))
        return 0
      }
      console.log()
    }
  }

  return install({
    dryRun,
    targets: targets ?? HARNESS_NAMES,
    packs: packs ?? PACK_NAMES,
  })
}

async function run() {
  const [cmd, ...rest] = argv
  switch (cmd) {
    case 'install':
      return runInstall()
    case 'scan':
      return scan()
    case 'doctor':
      return doctor()
    case 'skills': {
      const [sub, name] = rest
      if (!sub) return list()
      if (sub === 'add') return name ? add(name) : fail('beast skills add <name>')
      if (sub === 'rm') return name ? rm(name) : fail('beast skills rm <name>')
      return fail(`unknown: beast skills ${sub}`)
    }
    case undefined:
    case '-h':
    case '--help':
      console.log(USAGE)
      return 0
    default:
      return fail(`unknown command: ${cmd}`)
  }
}

function fail(msg) {
  console.error(`${c.red(msg)}\n\n${USAGE}`)
  return 1
}

process.exit(await run())
