# UI property testing with Bombadil

Loaded from `SKILL.md` for the UI property pass. Bombadil (`antithesishq/bombadil` on GitHub, MIT, by Antithesis, actively released) explores a web or terminal UI by itself: it reads the current state, checks your properties, picks a random action, and repeats. It finds what scripted tests miss: unexpected orders, double clicks, back and reload in the middle of a flow, odd input. Scripted tests check the paths someone wrote; properties state what must hold on every path.

## When it fits

- A web app (any framework, server-rendered, or static) or a terminal app. Electron and other Chromium shells work through a remote debugging port (`bombadil browser test-external --remote-debugger <url>`).
- An isolated instance with disposable, seeded data. Bombadil clicks everything it can reach, including delete, send, and sign out. Never point it at real accounts, a shared instance, or production.
- Rules you can state from what is on screen.

It does not fit native mobile apps, canvas-only interfaces without custom actions, or exact layout checks (use captures for those). It works best once the app driver exists, since `start`, `as <role>`, and seeded data are what each run needs.

## Install

Check need, provenance, and maintenance first, per the dependency rule. Use the release binary from the project's GitHub releases or the npm dev dependency `@antithesishq/bombadil` (which also brings the TypeScript types), and pin the version. It needs Chrome or Chromium installed for browser runs. On macOS, download the binary with `curl`, not a browser, or Gatekeeper blocks it. The CLI is pre-1.0 and changes between releases: check flag names against `bombadil --help` for the installed version before relying on the commands below.

## Run it

```sh
bombadil browser test http://127.0.0.1:4173 spec.ts \
  --headless --time-limit 10m --exit-on-violation \
  --output-path evidence/bombadil/member.trace
```

- Exploration stays on the origin's scheme, host, and port unless you add `--allow-url` patterns.
- Sign in with `--cookie NAME=VALUE` using a seeded session from the driver, or `--header`, or a custom action that fills the login form, or run `test-external` against a browser that is already signed in.
- One run per kind of user, each with that role's properties.
- Exit code 0 means no violation (including reaching the time limit), 2 means a property was violated, 1 means another error.
- `bombadil browser inspect <trace>` opens a viewer of each step, before and after, with screenshots. `bombadil trace <trace> --screenshots <dir>` writes each state's screenshot; `--json` prints one object per state.

## Write the properties

A specification is a TypeScript module that exports properties and action generators. Start from the defaults, which check for uncaught exceptions, unhandled promise rejections, console errors, and HTTP 4xx and 5xx responses, and which click, type, scroll, and navigate. Then add the product's rules.

- `extract(state => ...)` runs in the page at every captured state and returns JSON-serialisable data; read it with `.current`.
- `always(...)` must hold in every state. `eventually(...).within(n, "seconds")` must happen within a time bound. `next(...)` must hold in the next state. `now(...)` lifts a condition so it can combine with `.implies`, `.and`, and `.or`.
- The specification runtime is limited; packages that need Node built-ins may not load.

Properties worth writing:

- **Privacy as a UI property.** Run as a given role and assert what that role must never see: amounts, private titles, another tenant's names.
- **No raw internals.** Tokens, stack traces, internal ids, and words the product never shows users.
- **No dead ends.** An error either clears or offers a way to retry. Every screen except the agreed end screens has an enabled way out.
- **Depth limits.** No more nested layers than the product allows, such as at most one dialog open, or no route deeper than the agreed path depth.
- **Loading resolves.** A busy indicator disappears within a bound.
- **Counts agree.** A badge equals the rows in the list it counts.
- **Allowed moves only.** A value changes only by the steps the design allows; Bombadil's manual shows this pattern with `now` and `next`.
- **No leaks.** `noResourceLeak` from the browser extras, on DOM node or event listener counts.

An example to adapt (selectors and patterns are placeholders):

```ts
import { extract, always, eventually, now } from "@antithesishq/bombadil";
export * from "@antithesishq/bombadil/browser/defaults";

const text = extract((s) => s.document.body?.innerText ?? "");
const openDialogs = extract((s) => s.document.querySelectorAll('[role="dialog"]').length);
const alertShown = extract((s) => s.document.querySelector('[role="alert"]') !== null);
const alertHasRetry = extract((s) => s.document.querySelector('[role="alert"] button') !== null);
const busy = extract((s) => s.document.querySelector('[aria-busy="true"]') !== null);

// Run signed in as a member: members never see money.
export const memberSeesNoAmounts = always(
  () => !/[$€£₹]\s?\d|\d\s?(USD|EUR|GBP|INR)\b/.test(text.current),
);

export const noSecretsOnScreen = always(
  () => !/Bearer\s+\S{8,}|eyJ[\w-]{20,}\.[\w-]{10,}\.[\w-]{10,}|sk_(live|test)_\w{8,}/.test(text.current),
);

export const atMostOneDialog = always(() => openDialogs.current <= 1);

export const errorsClearOrOfferRetry = always(
  now(() => alertShown.current && !alertHasRetry.current).implies(
    eventually(() => !alertShown.current).within(10, "seconds"),
  ),
);

export const loadingFinishes = always(
  now(() => busy.current).implies(eventually(() => !busy.current).within(15, "seconds")),
);
```

To keep Bombadil away from an action even on disposable data (a real outbound send, deleting the test account), restrict the default action generators with their `filter` or `when` methods. Read the action shape in the installed version's docs; it changes between releases.

## When a property breaks

1. Open the trace with `inspect` or `trace` and read the steps.
2. Reproduce it with the same options plus `--reproduce=<trace>`. Shrink a long trace with `bombadil browser shrink --trace <trace> <origin> spec.ts` (experimental).
3. Tell it as product steps: "1. As a member, open Tasks. 2. Open a task. 3. Press back twice. 4. The invoice amount shows."
4. Turn it into an ordinary test or driver script that fails on the bug, then fix the bug. Keep the property.
5. When the property itself was wrong, fix it in the spec with a one-line reason. Never delete or loosen a property just to get a clean run.

## Comparing builds

Run the same spec, roles, and time limit against the previous build and the new one. A violation on both is pre-existing; report the new ones first.
