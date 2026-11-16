# Browser snippets

Loaded from `SKILL.md` when the runtime exposes a Playwright-style `tab` object (for example Codex's in-app browser). Adapt the calls to the browser tool you have, such as the project's app driver or T3 Code's `preview_*` tools, and rename variables to avoid redeclaration conflicts.

## DOM snapshot

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

## Rendered leak scan

```js
await tab.playwright.evaluate(() => {
  const body = document.body.innerText;
  return [...body.matchAll(/\b(pde:v1:[A-Za-z0-9._:-]{20,}|Bearer\s+[A-Za-z0-9._-]{8,}|sk_(live|test)_[A-Za-z0-9_]{8,}|pk_(live|test)_[A-Za-z0-9_]{8,}|ya29\.[A-Za-z0-9._-]{8,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/g)]
    .slice(0, 20)
    .map((m) => m[0].slice(0, 120));
});
```

## Keyboard focus smoke

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

