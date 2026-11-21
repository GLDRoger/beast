import { readFileSync } from 'node:fs'
import { HARNESSES, HARNESS_NAMES, inHome, GENERATED_MARKER, SELECTION_FILE } from './manifest.mjs'
import { writeGenerated } from './fsutil.mjs'
import { whichBinary } from './platform.mjs'

const CALLS = {
  claude: '`claude -p --model <model>`',
  codex: '`codex exec` or `codex review`',
  grok: '`grok -p --model <model>`',
  gemini: '`gemini` / `agy` (Gemini 4 Neon)',
}

/**
 * Outside T3 Code, Codex and Claude Code can call each other through their
 * headless CLIs. AGENT_CALL_DEPTH marks a worker so hooks leave delegated
 * sessions to their caller.
 */
const CROSS_HARNESS = [
  '## Calling another harness outside T3 Code', '',
  'When T3 Code orchestration (`delegate_task`) is unavailable, Codex and Claude Code can call each other through their headless CLIs. Native subagents stay the default for same-harness work.', '',
  'Write the brief to a file and pass it on standard input; long prompts break shell quoting. Open the brief by telling the worker it was called by another agent and should do the task itself. Set `AGENT_CALL_DEPTH=1` on the command. A worker whose shell already has `AGENT_CALL_DEPTH` set completes its task directly.', '',
  '**Claude Code, from Codex.** Run in the project directory:', '',
  '```sh',
  'AGENT_CALL_DEPTH=1 claude -p --model <opus|sonnet|…> --effort <low|medium|high|xhigh|max> --output-format json < brief.md > result.json',
  '```', '',
  '`.result` holds the answer and `.session_id` the conversation. Continue it with `claude -p --resume <session_id> --output-format json < followup.md`. For a read-only task, add `--disallowedTools Edit Write MultiEdit NotebookEdit`.', '',
  '**Codex, from Claude Code:**', '',
  '```sh',
  'AGENT_CALL_DEPTH=1 codex exec --model gpt-6.2-sol -c model_reasoning_effort=<low|medium|high> --cd <dir> --skip-git-repo-check --json -o result.md - < brief.md > events.jsonl',
  '```', '',
  '`result.md` holds the final answer; the `thread.started` event in `events.jsonl` carries the `thread_id`. Continue it from the same directory with `codex exec resume --skip-git-repo-check <thread_id> -o result.md - < followup.md`. For a read-only task, add `--sandbox read-only`.', '',
  'A call takes seconds to many minutes. Run a long one in the background and read the output file when it finishes. Treat the worker\'s answer as a claim: read its diff and rerun the checks that matter before reporting the work as done.', '',
]

/** Installation targets are configuration intent, not provider reachability or entitlement. */
export function delegationCapabilities(targets = [], findBinary = whichBinary) {
  return {
    targets: HARNESS_NAMES.filter((name) => targets.includes(name)),
    direct: HARNESS_NAMES.filter((name) => HARNESSES[name].bin && findBinary(HARNESSES[name].bin)),
  }
}

/** Pure rendering keeps capability decisions testable without contacting any provider. */
export function renderDelegation({ targets, direct }) {
  const lines = [
    `<!-- ${GENERATED_MARKER} -->`, '',
    '# Delegation guidance', '',
    'Refresh this local capability snapshot with `beast delegation`; no reinstall is needed.',
    `Configured Beast harnesses: ${targets.length ? targets.map((n) => HARNESSES[n].label).join(', ') : 'not recorded'}.`,
    'Configuration selection and executable presence do not establish authentication, subscription access, model availability, or permission to dispatch.', '',
    '## Cross-provider orchestration (T3 Code)', '',
    'Inside T3 Code, use `orchestrator_capabilities` to discover live providers and models, then dispatch cross-provider work with `delegate_task`. Do not shell out to headless CLIs when T3 Code orchestration is available.', '',
    '## Use the current harness', '',
    '- **Codex:** use native subagents for useful bounded same-task work only when the current instructions permit it. Create a user-owned task only when the user asks for one.',
    '- **Claude Code:** use its native task/agent capability when exposed and permitted; choose an available model rather than a saved ranking.',
    '- **Antigravity:** use native subagents (`self`) for same-provider work, or `delegate_task` in T3 Code for other providers.',
    '- **Grok:** use native delegation only if the current runtime exposes it; otherwise handle the work locally or use T3 Code / an authorized CLI below.',
    '- **Hermes:** use the active profile and its exposed delegation tools.', '',
    'Delegate only an independent contribution that improves the result. The primary agent keeps scope, integration, verification, and the final decision. Do not fill concurrency slots merely because they exist.', '',
  ]
  if (direct.includes('claude') && direct.includes('codex')) lines.push(...CROSS_HARNESS)
  if (direct.length) {
    lines.push('## Direct CLIs detected on PATH', '')
    for (const name of direct) lines.push(`- **${HARNESSES[name].label}** — ${CALLS[name]}`)
    lines.push('', 'These are executable-presence checks only. Check current command support, authentication, and authorized resource limits before invoking one. Prefer T3 Code `delegate_task` or native same-task delegation when it fits.', '')
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
