import { emitKeypressEvents } from 'node:readline'
import { c } from './fsutil.mjs'

/**
 * Minimal arrow-key prompts. No dependency on purpose: a fresh clone must be
 * runnable with `node bin/beast.mjs` before anything is installed, and an
 * installer that needs an install first is worse than a plain one.
 *
 * Not a TUI — no alternate screen, no redraw loop beyond the option list. If
 * stdin is not a TTY (CI, piped input), callers fall back to flags.
 */

export const isInteractive = () => Boolean(process.stdin.isTTY && process.stdout.isTTY)

const ESC = '\x1b'
const show = () => process.stdout.write(`${ESC}[?25h`)
const hide = () => process.stdout.write(`${ESC}[?25l`)
const up = (n) => (n > 0 ? `${ESC}[${n}A` : '')
const clearDown = () => `${ESC}[J`

/** Read keypresses until `handle` returns a value. Restores the terminal always. */
function capture(render, handle) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process
    const wasRaw = stdin.isRaw
    emitKeypressEvents(stdin)
    stdin.setRawMode(true)
    stdin.resume()
    hide()

    let lastLines = 0
    const draw = () => {
      stdout.write(up(lastLines) + clearDown())
      const out = render()
      lastLines = out.split('\n').length - 1
      stdout.write(out)
    }

    const cleanup = () => {
      stdin.removeListener('keypress', onKey)
      stdin.setRawMode(wasRaw ?? false)
      stdin.pause()
      show()
    }

    const onKey = (str, key) => {
      // Ctrl-C must always work, even mid-prompt.
      if (key?.ctrl && key.name === 'c') { cleanup(); stdout.write('\n'); process.exit(130) }
      let done
      try { done = handle(str, key, draw) } catch (err) { cleanup(); return reject(err) }
      if (done !== undefined) { cleanup(); return resolve(done) }
      draw()
    }

    stdin.on('keypress', onKey)
    draw()
  })
}

/** Single choice. options: [{value, label, hint}] */
export async function select(message, options) {
  let i = 0
  const render = () => {
    const lines = [`${c.bold('?')} ${message}`]
    options.forEach((o, n) => {
      const active = n === i
      lines.push(
        `${active ? c.green('❯') : ' '} ${active ? c.bold(o.label) : o.label}` +
        (o.hint ? `  ${c.dim(o.hint)}` : ''),
      )
    })
    lines.push(c.dim('  ↑↓ move · enter select · ctrl-c cancel'))
    return lines.join('\n') + '\n'
  }
  return capture(render, (str, key) => {
    if (key?.name === 'up' || str === 'k') i = (i - 1 + options.length) % options.length
    else if (key?.name === 'down' || str === 'j') i = (i + 1) % options.length
    else if (key?.name === 'return') return options[i].value
  })
}

/**
 * Multiple choice. `all` is a real entry rather than a separate question — asking
 * "everything?" and then "which?" makes the common case two prompts instead of one.
 */
export async function multiselect(message, options, { preselected = [] } = {}) {
  const chosen = new Set(preselected)
  let i = 0
  const allSelected = () => chosen.size === options.length

  const render = () => {
    const lines = [`${c.bold('?')} ${message}`]
    options.forEach((o, n) => {
      const on = chosen.has(o.value)
      const active = n === i
      lines.push(
        `${active ? c.green('❯') : ' '} ${on ? c.green('◉') : c.dim('◯')} ` +
        `${active ? c.bold(o.label) : o.label}` +
        (o.hint ? `  ${c.dim(o.hint)}` : ''),
      )
    })
    lines.push(c.dim(`  ↑↓ move · space toggle · a ${allSelected() ? 'none' : 'all'} · enter confirm`))
    if (!chosen.size) lines.push(c.yellow('  nothing selected'))
    return lines.join('\n') + '\n'
  }

  return capture(render, (str, key) => {
    if (key?.name === 'up' || str === 'k') i = (i - 1 + options.length) % options.length
    else if (key?.name === 'down' || str === 'j') i = (i + 1) % options.length
    else if (str === ' ') {
      const v = options[i].value
      chosen.has(v) ? chosen.delete(v) : chosen.add(v)
    } else if (str === 'a') {
      allSelected() ? chosen.clear() : options.forEach((o) => chosen.add(o.value))
    } else if (key?.name === 'return' && chosen.size) {
      return options.filter((o) => chosen.has(o.value)).map((o) => o.value)
    }
  })
}

export async function confirm(message, { defaultYes = true } = {}) {
  const render = () =>
    `${c.bold('?')} ${message} ${c.dim(defaultYes ? '(Y/n)' : '(y/N)')}\n`
  return capture(render, (str, key) => {
    if (key?.name === 'return') return defaultYes
    if (str?.toLowerCase() === 'y') return true
    if (str?.toLowerCase() === 'n') return false
  })
}
