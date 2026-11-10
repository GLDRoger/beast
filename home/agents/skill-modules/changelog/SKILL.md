---
name: changelog
description: "Turn recent git history into a weekly social changelog card ready to screenshot. Use when you want a crisp public “what shipped” beat without writing it from scratch."
category: workflow
tags: [changelog, twitter, marketing, git]
author: tushaarmehtaa
---

Generate the weekly changelog Twitter card. Run every Friday (or whenever you ship).

## Steps

### 1. Get this week's commits
```bash
git log --oneline --since="7 days ago"
```

Get the stats:
```bash
# Commit count
git log --oneline --since="7 days ago" | wc -l

# Files + lines changed
git log --since="7 days ago" --pretty=tformat: --numstat | awk '{files++; add+=$1; del+=$2} END {print files " files · " add+del " lines"}'
```

### 2. Understand what actually shipped
Read each commit message. For any that are unclear, look at the diff:
```bash
git show [commit-hash] --stat
```
Group commits into themes. Ignore pure refactors, dependency bumps, and test fixes — users don't care. Focus on what changed for them.

### 3. Distill into items
Let the number of items follow what shipped: one per change a user would notice, usually somewhere between three and eight. Padding a quiet week or squeezing a busy one into a fixed count misrepresents it. If earlier changelogs exist, match their length and format.

Each item has:
- **An emoji, if the project's changelog uses them** (✨ new feature, 🐛 fix, ⚡ performance, 🎨 design, 🔒 security, etc.). Leave them out when earlier entries do, or when there is no earlier changelog and the product's voice is plain.
- **A short title** — 3-5 words, lowercase, punchy
- **2-3 lines of body** — explain the user benefit, not the technical detail. Write like a human, not a release note. "credits update in real time" not "implemented shared zustand store for credit synchronisation."

When many small related fixes shipped, group them into one item rather than listing each. An "under the hood" item about stability or performance is fine when that work was real.

### 4. Find or create the changelog template
Look for a `changelogs/` directory in the repo. If there's a `template.html`, use it.

If no template exists, create `changelogs/template.html` with this structure:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 628px; overflow: hidden;
      background: #09090b; font-family: 'JetBrains Mono', ui-monospace, monospace;
      display: flex; flex-direction: column; padding: 48px;
    }
    .header { color: #71717a; font-size: 13px; margin-bottom: 32px; letter-spacing: 0.05em; }
    .header span { color: #fafafa; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; }
    .item { display: flex; gap: 12px; }
    .emoji { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
    .content h3 { color: #fafafa; font-size: 13px; font-weight: 700; margin-bottom: 4px; }
    .content p { color: #71717a; font-size: 11px; line-height: 1.6; }
    .content p strong { color: #a1a1aa; }
    .footer { color: #3f3f46; font-size: 11px; margin-top: 24px; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="header">what shipped this week · <span>MONTH DAY</span></div>
  <div class="grid">
    <div class="item"><div class="emoji">EMOJI</div><div class="content"><h3>TITLE</h3><p>BODY LINE 1<br>BODY LINE 2<br><strong>BODY LINE 3</strong></p></div></div>
    <!-- one .item per change; drop the .emoji div if the changelog doesn't use emoji -->
  </div>
  <div class="footer">N commits · N files · N lines · all live</div>
</body>
</html>
```

### 5. Create this week's file
Create `changelogs/YYYY-MM-DD.html` (use today's date).

Fill in:
- Header date (e.g. "what shipped this week · march 1")
- The items from step 3
- Footer stats from step 1

### 6. Open in browser
```bash
open changelogs/YYYY-MM-DD.html
```

Tell the user: "ready — screenshot the browser window (⌘+Shift+4 on Mac) and post it."

## Voice
Lowercase. Direct. No buzzwords. User benefit first, technical detail never. If you can't explain the value to a non-engineer in one line, rewrite it.

## Design rule
If using an existing template — never touch the CSS. Content only. The design is locked.
