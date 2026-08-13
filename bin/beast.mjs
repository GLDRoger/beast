#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { install } from '../lib/install.mjs'
import { doctor } from '../lib/doctor.mjs'
import { scan } from '../lib/scan.mjs'
import { list, add, rm } from '../lib/skills.mjs'
import { c } from '../lib/fsutil.mjs'
import { HARNESSES, HARNESS_NAMES, inHome } from '../lib/manifest.mjs'
import { PACKS, PACK_NAMES, REQUIRED_PACKS } from '../lib/packs.mjs'
import { whichBinary } from '../lib/platform.mjs'
import { isInteractive, multiselect, select, confirm } from '../lib/prompt.mjs'
import { coverageWarning } from '../lib/coverage.mjs'
import { planConfigEdits, hasPendingEdits, configQuestion, EDITABLE } from '../lib/config-write.mjs'

const USAGE = `${c.bold('beast')} — install one agent config across Claude Code, Codex, and Grok

  beast install                interactive: pick harnesses, then skill packs
  beast install --all          everything, no prompts
  beast install --harness=claude,codex --packs=core,design
  beast install --dry-run      show every link without touching anything
  beast install --write-config add the few config keys beast needs (asked interactively)
  beast install --no-write-config   never touch harness config
  beast scan                   list every skill source and how to retire each
  beast doctor                 verify links, config, skill budget, secrets
  beast skills                 list the active set
  beast skills add <name>      activate a module from the library
  beast skills rm <name>       deactivate a skill

  harnesses: ${HARNESS_NAMES.join(', ')}
  packs:     ${PACK_NAMES.join(', ')}   ${c.dim('(core is always included)')}

Config that holds your own state (settings.json, config.toml) ships as .example.
With --write-config the installer adds only the keys beast needs, verifying the
result parses and changed nothing else. See README.md.`

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const valueOf = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3).split(',').map((s) => s.trim()).filter(Boolean) : null
}

/**
 * Reject anything not in `allowed` rather than ignoring it.
 *
 * Silently ignoring an unknown option is the worst possible behaviour for this tool:
 * `--pakcs=core` and `--harness codex` (space, not `=`) both parsed as "no selection
 * given" and installed EVERYTHING, reporting success. A typo must not widen the install.
 */
function unknownOptions(allowed) {
  const bad = []
  for (const a of argv.slice(1)) {
    if (!a.startsWith('--')) { bad.push(`unexpected argument "${a}"`); continue }
    const [name, value] = a.includes('=') ? [a.slice(2, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a.slice(2), null]
    const spec = allowed[name]
    if (!spec) { bad.push(`unknown option "--${name}"`); continue }
    if (spec === 'value' && value === null) bad.push(`--${name} needs a value: --${name}=<list>`)
    if (spec === 'value' && value === '') bad.push(`--${name} was given an empty value`)
    if (spec === 'flag' && value !== null) bad.push(`--${name} takes no value`)
  }
  return bad
}

/** The two video stacks. Alternatives, not complements — see the comment in packs.mjs. */
const VIDEO_PACKS = ['video', 'remotion']

/**
 * Narrow both video packs down to the stack the user actually wants.
 *
 * Only asked when the pack answer contains both, which the default preselection does.
 * Installing both is allowed and sometimes right; it is just never right by accident,
 * because each stack's skills sit in the harness's listing budget whether or not the
 * project uses that stack. Flags skip this entirely: `--packs=video,remotion` means both.
 */
async function chooseVideoStack(packs) {
  if (VIDEO_PACKS.filter((p) => packs.includes(p)).length < 2) return packs

  const cost = (p) => `${PACKS[p].skills.length} skills`
  console.log()
  const keep = await select('Two video stacks are available. Which do you want?', [
    { value: ['video'], label: 'HyperFrames', hint: `${cost('video')} · HTML + GSAP, hyperframes CLI` },
    { value: ['remotion'], label: 'Remotion', hint: `${cost('remotion')} · React/TSX, remotion CLI` },
    { value: VIDEO_PACKS, label: 'Both', hint: 'every video skill loads, in every session' },
    { value: [], label: 'Neither', hint: 'skip video skills' },
  ])
  const rest = packs.filter((p) => !VIDEO_PACKS.includes(p))
  return PACK_NAMES.filter((p) => rest.includes(p) || keep.includes(p))
}

/** Ask which harnesses and packs, preselecting what looks already present. */
async function chooseInteractively() {
  console.log(`\n${c.bold('beast install')}\n`)

  const harnessOpts = HARNESS_NAMES.map((n) => {
    // hermes has no binary to probe; its marker is the home directory itself.
    const found = HARNESSES[n].bin
      ? Boolean(whichBinary(HARNESSES[n].bin))
      : existsSync(inHome('.hermes'))
    return {
      value: n,
      label: HARNESSES[n].label,
      // Preselecting only what is installed avoids linking config for a CLI the
      // user does not have — the commonest way to end up with dead config.
      hint: found ? `${HARNESSES[n].hint}  ${c.green('· found')}` : `${HARNESSES[n].hint}  ${c.dim('· not on PATH')}`,
      present: found,
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

  const packs = await chooseVideoStack(
    await multiselect('Which skill packs?', packOpts, { preselected: PACK_NAMES }),
  )
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
  const bad = unknownOptions({
    'dry-run': 'flag', all: 'flag', harness: 'value', packs: 'value',
    'write-config': 'flag', 'no-write-config': 'flag',
  })
  const dryRun = has('--dry-run')
  let targets = valueOf('harness')
  let packs = valueOf('packs')
  if (has('--write-config') && has('--no-write-config')) bad.push('--write-config and --no-write-config contradict each other')
  // Explicit flags win over the question. Absent both, an interactive run asks and a
  // scripted one declines: a CI job that never saw the question should not come back
  // to an edited config.
  let writeConfig = has('--write-config') ? true : has('--no-write-config') ? false : null

  bad.push(
    ...(targets ?? []).filter((t) => !HARNESS_NAMES.includes(t)).map((t) => `unknown harness "${t}"`),
    ...(packs ?? []).filter((p) => !PACK_NAMES.includes(p)).map((p) => `unknown pack "${p}"`),
  )
  if (bad.length) {
    for (const b of bad) console.error(c.red(b))
    console.error(`\nharnesses: ${HARNESS_NAMES.join(', ')}\npacks: ${PACK_NAMES.join(', ')}`)
    console.error(c.dim('options take an = sign: --harness=claude,codex'))
    return 1
  }

  const explicit = targets || packs || has('--all')
  if (!explicit) {
    if (!isInteractive()) {
      // Piped or CI: prompting would hang forever. Install for the CLIs that are
      // actually on PATH rather than all three — configuring a harness the machine does
      // not have puts it in the delegation list and sends agents at a binary that is not
      // there. `--all` is still the way to ask for everything regardless.
      const found = HARNESS_NAMES.filter((n) => whichBinary(HARNESSES[n].bin))
      targets = found.length ? found : HARNESS_NAMES
      console.log(c.dim(found.length
        ? `non-interactive: installing for the CLIs found on PATH (${found.join(', ')}) — pass --all for every harness`
        : 'non-interactive: no CLI found on PATH, installing every harness'))
    } else {
      const chosen = await chooseInteractively()
      targets = chosen.targets
      packs = chosen.packs
      if (writeConfig === null) writeConfig = await askConfig(targets)
      const summary = `${targets.join(', ')} · packs: ${packs.join(', ')}`
      if (!dryRun && !(await confirm(`Install for ${summary}?`))) {
        console.log(c.dim('\ncancelled'))
        return 0
      }
      console.log()
    }
  }

  if (writeConfig === null) {
    writeConfig = false
    const pending = planConfigEdits((targets ?? HARNESS_NAMES).filter((t) => EDITABLE.includes(t)), { assumeInstalled: true })
    if (hasPendingEdits(pending)) {
      console.log(c.dim('non-interactive: harness config left untouched — pass --write-config to add the keys beast needs'))
    }
  }

  return install({
    dryRun,
    targets: targets ?? HARNESS_NAMES,
    packs: packs ?? PACK_NAMES,
    writeConfig,
  })
}

/**
 * Ask before editing config, and only when there is something to edit. A question
 * whose answer changes nothing teaches people to stop reading the questions.
 */
async function askConfig(targets) {
  const plans = planConfigEdits(targets.filter((t) => EDITABLE.includes(t)), { assumeInstalled: true })
  if (!hasPendingEdits(plans)) return false

  console.log(`${c.bold('Harness config.')} Your ${c.bold('config.toml')} files hold your own auth, trust`)
  console.log('  settings, and MCP servers. beast can add just the keys it needs so that')
  console.log(`  bare ${c.bold('codex')} and ${c.bold('grok')} pick up the prompt and skills, not only the`)
  console.log('  c/co/gro helpers. Keys already set are never changed.\n')
  for (const line of configQuestion(plans)) {
    if (line.file) console.log(`  ${c.dim(line.file)}`)
    else console.log(`    ${line.key} ${c.dim(`— ${line.why}`)}`)
  }
  console.log(c.dim('\n  The original is copied to ~/.beast/pre-beast first, and the edit is'))
  console.log(c.dim('  discarded if the result does not parse or changes anything else.\n'))
  const yes = await confirm('Add these keys?')
  console.log()
  return yes
}

async function run() {
  const [cmd, ...rest] = argv
  // Every verb but `install` takes no options. Accepting them silently would let
  // `beast doctor --harness=codex` look like it scoped the check when it did not.
  const noOptions = () => (rest.length ? fail(`${cmd} takes no options (got ${rest.join(' ')})`) : null)

  switch (cmd) {
    case 'install':
      return runInstall()
    case 'scan':
      return noOptions() ?? scan()
    case 'doctor':
      return noOptions() ?? doctor()
    case 'skills': {
      const [sub, name, ...extra] = rest
      if (extra.length) return fail(`beast skills ${sub ?? ''} takes one name (got ${extra.length} extra)`)
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
