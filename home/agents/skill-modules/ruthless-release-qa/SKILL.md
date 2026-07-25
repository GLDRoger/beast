---
name: ruthless-release-qa
description: "Behave like a hostile release tester — every path, state, and awkward client. Use right before public ship when “seems fine” is not a strategy."
---

# Ruthless Release QA

Use this skill when the user wants Codex to test an app like a public-release gatekeeper, not a casual smoke tester.

The mindset: **assume the app is not ready until evidence says otherwise.** Click broadly, verify deeply, document honestly, and never claim coverage you did not perform.

## Non-negotiable principles

1. **Be honest about scope.** Distinguish tested, partially tested, blocked, unsafe-to-test, and not tested.
2. **Do not mutate real user data unless explicitly authorized and test-safe.** Sending mail, deleting/archiving/blocking/unsubscribing, processing historical mail, saving calendar events, running rules, OAuth connection, external integration connect, checkout/cancel/update billing, and file downloads are mutation/external actions. Use seeded test accounts/test mode or stop and document prerequisites.
3. **Provider parity matters.** If the app supports multiple providers/accounts, test each separately and then test switching between them.
4. **Every visible action needs a result.** A button that does nothing, opens no state, lacks hover/focus, has bad disabled feedback, or mutates without confirmation is a finding.
5. **No raw internals in UI.** Treat visible ciphertext, tokens, OAuth codes/states, stack traces, provider errors, secret-looking strings, `Bearer`, JWTs, Stripe secrets, and storage payloads as release blockers until disproven.
6. **Do not confuse unit checks with release QA.** Automated tests help, but browser evidence and real environment drills are still required.
7. **End in a useful state.** If you sign out or navigate away during QA, restore the browser to a sensible app route unless the user asks otherwise.

## Start-of-run checklist

1. Identify:
   - current URL and account/provider
   - dev server / environment URL
   - repo path, if available
   - existing QA report file, if any
   - whether current browser is authenticated
2. Create or append to a markdown QA report under the repo, usually:
   - `docs/qa/YYYY-MM-DD-in-app-browser-app-qa.md`
3. State safety boundaries before executing risky flows:
   - what will be clicked
   - what will not be clicked without seeded test accounts/test mode
4. If using Browser, initialize the in-app Browser session and name it clearly.
5. If repo context is needed, prefer a compact snapshot before broad searching:
   - `~/.codex/scripts/repo_snapshot.py <repo>`

## Coverage model

Use this sequence. Do not stop at the surface.

### 1. Auth and account lifecycle

Test, where safe:

- logged-out public pages
- login page controls
- sign-in buttons and provider copy
- account chooser behavior
- successful sign-in if a saved safe account exists
- sign-out and logged-out redirects
- protected route access while logged out
- account switcher
- provider labels in global chrome, command palette, settings, and URLs

Document as findings:

- provider-specific hardcoding in generic states
- beta/access-paused copy conflicting with active sign-in CTAs
- empty accessible labels on auth controls
- protected routes flashing or mixing private app shell with public pages
- OAuth success/failure analytics missing

### 2. Route inventory and route sweep

Find route surfaces from code or navigation. Sweep both directly by URL and through UI navigation.

Common surfaces:

- landing/home
- login/logout
- pricing/billing/premium
- privacy/security/terms/support/legal pages
- waitlist/welcome/thank-you/no-access
- dashboard/home/flowboard
- mail inbox/drafts/sent/archive/labels/folders/search/filter/thread
- compose/reply/forward/schedule send
- cleanup/bulk unsubscribe/bulk archive/unhandled
- automation/rules/cold-email/test rules/process-past-emails
- calendar/month/week/day/new event/find availability/settings/meeting briefs
- people/contact detail
- analytics/stats
- integrations/custom connector/provider connect/test
- assistant/chat/command palette/guides
- settings/account/privacy/AI/provider/usage/organization
- onboarding/setup/permissions/consent
- admin/config/organization/team pages
- 404/bad routes

For each route record:

- URL requested and final URL
- provider/account context
- headings/main landmark presence
- loading/empty/error/loaded states
- visible controls
- obvious broken copy/layout
- raw leaks/security-sensitive text
- whether action was safe or intentionally not executed

### 3. Click-everywhere interaction pass

For each safe page, inspect and interact with:

- primary buttons
- secondary buttons
- icon-only buttons
- row actions
- overflow menus
- dropdowns/selectors
- tabs
- filters/search
- pagination/load more
- date/time fields
- toggles/switches/checkboxes/radios
- modals/dialogs/drawers/popovers/tooltips
- command palettes
- profile/account menus
- setup CTAs

For every interaction verify:

- opens expected UI
- closes with explicit close button
- closes with Escape, if appropriate
- traps focus when modal is open
- returns focus after close
- disabled actions explain why
- destructive actions confirm scope/account/provider and offer undo where possible
- loading state appears for slow work
- success/error state is scoped to the current action and clears correctly

### 4. Standard mail-client matrix

For mail apps, cover both provider-specific and generic behavior.

#### Safe browser checks

- inbox/drafts/sent/archive/folders/labels load states
- search query and URL state
- unread/read filter
- selected thread persistence
- thread open/close/back/next
- sender details/contact popover
- attachments visible but do not download unless safe
- reply/forward/compose modal opens
- empty send validation
- schedule-send modal opens and validates fields
- overflow menus show provider-correct labels (`Open in Gmail`, `Open in Outlook`, or generic fallback)
- bulk selection UI and disabled states
- archive/block/unsubscribe controls are identified but not executed on real data

#### Seeded-test-only mutation checks

Run only with seeded test Gmail/Outlook accounts:

- compose new email -> save draft -> discard -> send test email
- reply -> discard -> send
- forward -> discard -> send
- schedule send -> cancel -> reschedule
- archive -> undo/recover -> verify provider state
- delete/trash/spam -> recover where supported
- block sender -> unblock/recover
- unsubscribe -> confirm result/failure/undo
- rule create/edit/delete/reorder/test
- process past emails with confirmation/progress/cancel/undo

### 5. Provider parity pass

For every first-class provider/account:

1. Run the same route sweep.
2. Run the same mail-client matrix.
3. Run the same cleanup/automation/calendar/settings/assistant/integrations checks.
4. Compare findings.
5. Switch Provider A -> Provider B -> Provider A and look for stale state.

Look specifically for:

- wrong provider labels
- wrong external action labels
- stale selected thread ID
- stale search/filter params
- stale cleanup success banners
- stale analytics/people data
- wrong calendar/provider setup cards
- cross-account mailbox snippets
- provider-specific permission copy

### 6. Data-boundary/security UI scan

On every major authenticated and public page scan rendered text for:

- `pde:v1:` or other ciphertext/storage payloads
- `Bearer `
- JWT-looking values
- OAuth `code`, `state`, refresh/access tokens
- `sk_live_`, `sk_test_`, `pk_live_`, `pk_test_`
- API keys and secrets
- stack traces
- raw provider errors
- internal markers such as registries/build/debug tokens
- customer mailbox content on public/unauthenticated pages

If a leak appears in UI, mark **P1/P0 depending on sensitivity** and record exact route, visible context, and whether it reproduces after longer wait/reload/account switch.

### 7. Accessibility and keyboard pass

At minimum:

- Tab through global chrome and page body
- verify visible focus movement
- verify skip links or practical bypass of sidebars
- open command palette via keyboard
- close command palette with Escape
- open modals and close with Escape
- inspect accessible names for icon buttons and repeated row actions
- verify headings and one primary `main` landmark
- verify form labels and disabled-state explanations
- check duplicate `Close`, generic `Edit`, `More`, `Toggle menu`, `Open thread`, `Block`, `Archive`

Findings to record:

- focus stuck on `BODY`
- no visible focus ring
- focus escapes modal
- Escape does nothing
- repeated generic action labels
- empty accessible labels
- duplicate main landmarks/headings

### 8. Responsive pass

Use a viewport-capable browser/runtime. If the current Browser cannot actually change viewport size, **say so and do not claim responsive coverage**.

Required sizes:

- 390x844 mobile
- 768x1024 tablet
- 1280x720 desktop
- 1440x900 desktop

Required surfaces:

- landing/login/pricing/legal
- Flowboard/dashboard
- mail list/thread/compose
- cleanup
- calendar and modals
- settings/provider/billing
- command palette
- account menu

Look for:

- horizontal overflow
- clipped controls
- inaccessible sidebars
- modals off-screen
- broken sticky headers/footers
- layout shifts
- unreadable density
- hidden destructive confirmations

### 9. Network/error/fault pass

Use controlled staging fault injection or route interception. Do not fake success.

Check:

- mail list timeout/500/offline
- thread detail timeout/500/offline
- AI/chat provider failure
- calendar provider failure
- cleanup API failure
- settings save failure
- integration connect/test failure
- OAuth denied/missing scopes/expired state
- Stripe webhook delayed/failed

Expected:

- clear generic error message
- retry path
- no raw provider stack/error/token
- no infinite spinner
- no destructive action double-run
- correlation/support code where appropriate

### 10. Billing E2E pass

Only with Stripe test mode and a seeded account.

Check:

- pricing CTA for each plan
- checkout session creation
- successful payment with test card
- failed payment path
- webhook entitlement update
- customer portal open
- plan update
- payment method update
- cancel at period end
- immediate cancellation if supported
- reactivation/trial guard
- billing error UI/support path
- price IDs match public pricing

Also run project-specific Stripe readiness scripts when available.

### 11. Production config pass

Check local and deployed environment, as applicable:

- security headers: CSP, frame, content type, referrer, permissions, HSTS
- cache controls for sensitive routes
- robots.txt and sitemap.xml host correctness
- Sentry DSN/env/release configured
- analytics events for activation/OAuth/checkout/payment/cancellation
- public URLs do not point to localhost/staging
- support email/legal entity/current dates are correct
- public 404 does not mix with private app shell
- no internal markers in public legal/docs pages
- production env validation/security scripts pass

## Severity model

Use practical release severity:

- **P0:** active data exposure, credential/token leak, destructive action unsafe by default, auth/tenant boundary failure, public access to private data.
- **P1:** public-release blocker: broken primary route, provider copy wrong in auth/permissions, raw internal data visible, billing/auth/cleanup severe misbehavior, assistant/core product inaccessible.
- **P2:** serious UX/accessibility/reliability issue that should be fixed before broad launch: focus traps, duplicate landmarks, stale states, weak confirmations, missing loading/error states.
- **P3:** polish/readability/copy/spacing/SEO/accessibility improvements that can ship only if consciously accepted.

## Report format

Append findings to the QA markdown with this shape:

```markdown
---

# <Pass name>

**Date:** YYYY-MM-DD  
**Browser:** <browser/runtime>  
**Workspace/account/provider:** <if applicable>  
**Purpose:** <why this pass exists>

## Routes / surfaces covered

- ...

## Actions intentionally not executed

- ...

## Findings

### P1 — <clear title>

**Where:** `<route or surface>`  
**Observed:** <what actually happened>  
**Why this matters:** <release impact>  
**Expected:** <desired behavior>

---

## Coverage gaps / prerequisites

- ...

## Release readiness view

- Ready / not ready / blocked, with concrete blockers.
```

## Useful browser snippets

Use only if available in the runtime. Adapt variable names to avoid redeclaration conflicts.

### DOM snapshot

```js
await tab.playwright.evaluate(() => {
  const body = document.body.innerText.replace(/\s+/g, ' ').trim();
  const controls = [...document.querySelectorAll('button,a,input,textarea,select,[role="button"],[role="menuitem"]')]
    .map((el, i) => {
      const r = el.getBoundingClientRect();
      return {
        i,
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('placeholder') || el.textContent || '')
          .replace(/\s+/g, ' ')
          .trim(),
        href: el.getAttribute('href'),
        disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true',
        visible: r.width > 0 && r.height > 0,
      };
    })
    .filter((x) => x.visible);
  return {
    url: location.href,
    title: document.title,
    headings: [...document.querySelectorAll('h1,h2')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()),
    mainCount: document.querySelectorAll('main,[role="main"]').length,
    emptyLabels: controls.filter((c) => !c.label).slice(0, 20),
    genericLabels: controls.filter((c) => /^(Open thread|Edit|More rule actions|Toggle menu|Close|Block|Connect|View|Save|Cancel|Delete|Archive|More)$/i.test(c.label)).slice(0, 30),
    text: body.slice(0, 2500),
  };
});
```

### Rendered leak scan

```js
await tab.playwright.evaluate(() => {
  const body = document.body.innerText;
  return [...body.matchAll(/\b(pde:v1:[A-Za-z0-9._:-]{20,}|Bearer\s+[A-Za-z0-9._-]{8,}|sk_(live|test)_[A-Za-z0-9_]{8,}|pk_(live|test)_[A-Za-z0-9_]{8,}|ya29\.[A-Za-z0-9._-]{8,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/g)]
    .slice(0, 20)
    .map((m) => m[0].slice(0, 120));
});
```

### Keyboard focus smoke

```js
async function activeInfo() {
  return await tab.playwright.evaluate(() => {
    const e = document.activeElement;
    return {
      tag: e?.tagName,
      role: e?.getAttribute('role'),
      label: (e?.getAttribute('aria-label') || e?.getAttribute('placeholder') || e?.innerText || e?.value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120),
    };
  });
}
const sequence = [];
for (let i = 0; i < 20; i++) {
  await tab.cua.keypress({ keys: ['Tab'] });
  await new Promise((r) => setTimeout(r, 80));
  sequence.push(await activeInfo());
}
sequence;
```

## Stop condition

Stop only when:

1. The requested surfaces have been tested or explicitly marked blocked/unsafe.
2. Findings are written to the markdown report.
3. The browser is restored to a sensible route/account.
4. You clearly state whether the app is public-release ready.
5. You list exact remaining prerequisites for anything not executed.
