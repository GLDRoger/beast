import { readFileSync } from 'node:fs'
import { HARNESSES, HARNESS_NAMES, inHome, GENERATED_MARKER, SELECTION_FILE } from './manifest.mjs'
import { writeGenerated } from './fsutil.mjs'
import { whichBinary } from './platform.mjs'

const CALLS = {
  claude: '`claude -p --model <model>`',
  codex: '`codex exec` or `codex review`',
  grok: '`grok -p --model <model>`',
}

/**
 * Codex and Claude Code can also call each other through their headless CLIs,
 * with no broker between them: the fallback when agent-broker is unavailable,
 * or for a quick one-off call. Commands verified against codex-cli 0.156.1 and
 * Claude Code 2.1.283. AGENT_CALL_DEPTH marks a worker: the worker sees it in its
 * shell, and hooks (muse) read it to leave delegated sessions to their caller.
 */
const CROSS_HARNESS = [
  '## Calling the other harness', '',
  'Codex and Claude Code can also call each other through their headless CLIs. Use this when agent-broker is unavailable, or for a quick one-off call to the other model family. Native subagents stay the default for same-harness work.', '',
  'Write the brief to a file and pass it on standard input; long prompts break shell quoting. Open the brief by telling the worker it was called by another agent and should do the task itself. Set `AGENT_CALL_DEPTH=1` on the command. A worker whose shell already has `AGENT_CALL_DEPTH` set completes its task directly.', '',
  '**Claude Code, from Codex.** Run in the project directory:', '',
  '```sh',
  'AGENT_CALL_DEPTH=1 claude -p --model <opus|sonnet|…> --effort <low|medium|high|xhigh|max> --output-format json < brief.md > result.json',
  '```', '',
  '`.result` holds the answer and `.session_id` the conversation. Continue it with `claude -p --resume <session_id> --output-format json < followup.md`. For a read-only task, add `--disallowedTools Edit Write MultiEdit NotebookEdit`.', '',
  '**Codex, from Claude Code:**', '',
  '```sh',
  'AGENT_CALL_DEPTH=1 codex exec --model <gpt-6-sol|gpt-6-astra|…> -c model_reasoning_effort=<low|medium|high|xhigh> --cd <dir> --skip-git-repo-check --json -o result.md - < brief.md > events.jsonl',
  '```', '',
  '`result.md` holds the final answer; the `thread.started` event in `events.jsonl` carries the `thread_id`. Continue it from the same directory with `codex exec resume --skip-git-repo-check <thread_id> -o result.md - < followup.md`. For a read-only task, add `--sandbox read-only`.', '',
  'A call takes seconds to many minutes. Run a long one in the background and read the output file when it finishes. Treat the worker\'s answer as a claim: read its diff and rerun the checks that matter before reporting the work as done.', '',
]

/** Installation targets are configuration intent, not provider reachability or entitlement. */
export function delegationCapabilities(targets = [], findBinary = whichBinary) {
  return {
    targets: HARNESS_NAMES.filter((name) => targets.includes(name)),
    direct: HARNESS_NAMES.filter((name) => HARNESSES[name].bin && findBinary(HARNESSES[name].bin)),
    broker: Boolean(findBinary('broker')),
  }
}

/** Pure rendering keeps capability decisions testable without contacting any provider. */
export function renderDelegation({ targets, direct, broker }) {
  const lines = [
    `<!-- ${GENERATED_MARKER} -->`, '',
    '# Delegation guidance', '',
    'Refresh this local capability snapshot with `beast delegation`; no reinstall is needed.',
    `Configured Beast harnesses: ${targets.length ? targets.map((n) => HARNESSES[n].label).join(', ') : 'not recorded'}.`,
    'Configuration selection and executable presence do not establish authentication, subscription access, model availability, or permission to dispatch.', '',
    '## Use the current harness', '',
    '- **Codex:** use native subagents for useful bounded same-task work only when the current instructions permit it. Create a user-owned task only when the user asks for one.',
    '- **Claude Code:** use its native task/agent capability when exposed and permitted; choose an available model rather than a saved ranking.',
    '- **Grok:** use native delegation only if the current runtime exposes it; otherwise handle the work locally or use an authorized external path below.',
    '- **Hermes:** use the active profile and its exposed delegation tools. A local CLI snapshot does not describe MCP providers available to a remote profile.', '',
    'Delegate only an independent contribution that improves the result. The primary agent keeps scope, integration, verification, and the final decision. Do not fill concurrency slots merely because they exist.', '',
  ]
  if (broker) lines.push(
    '## Cross-provider work', '',
    'The agent-broker executable is present. Use agent-broker for intentional cross-provider work; discover its current providers, authentication, models, and tool schema before dispatch.',
    'In a runtime exposing agent-broker MCP, use that runtime capability information rather than assuming every local CLI is broker-enabled. No provider or model is inferred from broker installation alone.', '',
  )
  if (direct.includes('claude') && direct.includes('codex')) lines.push(...CROSS_HARNESS)
  if (direct.length) {
    lines.push('## Direct CLIs detected on PATH', '')
    for (const name of direct) lines.push(`- **${HARNESSES[name].label}** — ${CALLS[name]}`)
    lines.push('', 'These are executable-presence checks only. Check current command support, authentication, and authorized resource limits before invoking one. Prefer native same-task delegation when it fits.', '')
  } else lines.push('No external harness CLI was detected on PATH. Continue with the active runtime; an absent external collaborator is not a task blocker.', '')
  lines.push('Share only the minimum task context and permitted files. Preserve tenant/data boundaries, user-owned work, and explicit restrictions on external transmission or live systems. If a tool is unavailable or delegation is not permitted, continue directly.', '')
  return lines.join('\n')
}

export function writeDelegation(targets = []) {
  const capabilities = delegationCapabilities(targets)
  const path = inHome('.beast/delegation.md')
  return { ...writeGenerated(path, renderDelegation(capabilities)), path, have: capabilities.direct, capabilities }
}

/** Refresh guidance alone without changing selected packs, links, configs, or SOUL files. */
export function refreshDelegation() {
  let targets = []
  try {
    const saved = JSON.parse(readFileSync(SELECTION_FILE, 'utf8'))
    if (!Array.isArray(saved.targets) || saved.targets.some((n) => !HARNESS_NAMES.includes(n))) {
      return { ok: false, reason: 'selection.json has invalid harness targets; guidance was not changed' }
    }
    targets = saved.targets
  } catch (error) {
    if (error.code !== 'ENOENT') return { ok: false, reason: `cannot read selection.json: ${error.message}` }
  }
  return writeDelegation(targets)
}
