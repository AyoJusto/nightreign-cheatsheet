# Graphite Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the app to the agreed "Graphite" design: neutral grey palette with one amber accent, serif titles, an art-led Nightlord page with full weakness tables, and Nightlord medallions on the home screen.

**Architecture:** Colors already live as Tailwind v4 tokens in `src/ui/styles/theme.css`, so the palette is a token swap. The serif comes from a self-hosted Fontsource package (the CSP only allows same-origin fonts and the app must work offline). Layout changes stay inside the existing components (`Page`, `NumbersTable`, `HomeScreen`, `NightlordPicker`) plus one new route form, `/find/<nightlord>`.

**Tech Stack:** React 19, Tailwind v4 (`@theme` tokens), Vite 8 + vite-plugin-pwa, Vitest, Playwright (projects `phone` = iPhone 15 WebKit, `desktop` = Chrome 1440×900).

**Spec:** this plan's "Locked decisions" section, plus the approved mockup canvas https://claude.ai/artifact/1nNWNRGhaZKdbG19B9yuB8 (phone row: Home, Nightlord, Seed map, Bosses; desktop row below). The mockup shows the look. Where it and this plan disagree, this plan wins: it records decisions the user made after the mockup.

## Locked decisions

The user made each of these. Do not reopen them.

1. Palette is Graphite. Exact token values are in Task 1. No blue or indigo anywhere in the UI chrome (the user is tired of dark-blue themes). The game art (medallions, map) keeps its own colors.
2. Titles use Cormorant Garamond (weights 600 and 700, Latin subset only), self-hosted through `@fontsource/cormorant-garamond`. Body text keeps the system font stack already in `--font-sans`. No Inter, no Google Fonts link.
3. The Nightlord page leads with the Nightlord's medallion art, centered, with the name under it. Under the name sits a row of weakness icons only: no pills, no names, no numbers. The full "Damage negation" and "Status buildup" tables come next, then Night 1 and Night 2. The old "Weak to" summary card is deleted.
4. Enemy pages get the same icon row under the title (no art) and the same tables. An enemy with no weakness shows no icon row at all.
5. Table section titles lose their explanations. "Damage negation · below zero takes more" becomes "Damage negation", and "Status buildup · lower procs faster" becomes "Status buildup". The highlighted row tint and color carry the meaning.
6. The home screen replaces the big "Find My Seed" map card with a "Find My Seed" heading over a row of every Nightlord medallion, plus Unknown. Tapping one opens the existing picker at `/find/<id>` with that Nightlord already chosen, so the Shifting Earth choice shows immediately.
7. The home link list becomes tiles with an icon each: Nightlords, Bosses, Relic Effects, Weapon Effects, Builds. Labels keep their current wording.
8. The map screen and its bottom sheet are restyled only (new colors, serif seed title, amber night-1 ring, silver night-2 ring). Sheet heights, drag behavior and map layer chips do not change. The short phone chip labels ("Sites", "Rings", "Gaols") are intentional; leave them.
9. The Bosses list stays a plain searchable list. No weakness filter.
10. No helper or instruction copy anywhere. If a screen seems to need an explanation, report it instead of adding text.

## Global Constraints

- CSP in `vite.config.ts` is `font-src 'self'`. Fonts must be bundled; any request to `fonts.googleapis.com` or `fonts.gstatic.com` is a bug.
- Workbox precaches `**/*.{js,css,html,webp,png,json,woff2}`. The serif must be `.woff2` so it is available offline.
- The wide breakpoint is 900px everywhere (`useWide()` in `src/ui/useWide.ts`, and `min-[900px]:` / `@media (min-width: 900px)` in CSS). Do not introduce another breakpoint.
- Unlayered CSS in `src/ui/styles/*.css` and `src/ui/map.css` beats Tailwind utilities. To size something that one of those files already styles, change that CSS file. A Tailwind class will silently lose.
- Commit messages follow the repo style: an imperative plain-English subject (no `feat:` prefix), then a body explaining why. Look at `git log -5` before the first commit.
- Every color contrast for text must stay at or above 4.5:1. The values in Task 1 are checked; do not substitute others.

## Review Focus

Failure modes no task's main test covers, and the test each owning task adds for it:

1. Offline, or a strict CSP, with no network: the serif must still load. Task 2 asserts the font is loaded and no request went to a Google Fonts host.
2. Long Nightlord names ("Equilibrious Beast", "Fissure in the Fog") in the home medallion row at phone width must wrap inside their tile, not push the page sideways. Task 4 asserts the phone home page has no horizontal scroll.
3. Multi-form enemies (several number columns, e.g. `albinauric-archers`) must not overflow the page at phone width or in the desktop two-column grid. Task 3 asserts no horizontal page scroll on `#/enemy/albinauric-archers` in both projects.
4. Enemies with no numbers (e.g. `ancestral-followers`) must still render "No numbers for this one yet." and no empty icon row. Task 3 asserts this.
5. The Unknown pick: `/find/unknown` must open the picker with Unknown chosen and its Shifting Earth list showing. Task 4 covers this in a router unit test and an e2e test.

## Rules for the executor (read before Task 1)

STOP rule: Any mismatch between this plan and reality that has no branch: STOP and report. Never improvise around the plan.

INTENT gate: Before any behavior-changing edit, write `INTENT: code does <X>; the check/task expects <Y>; the spec says <Z>`, with Z read from the actual spec/docstring/README. If X, Y, Z disagree: STOP and report the conflict instead of editing. Every INTENT line appears in your report. Authority order for conflicts: explicit user statement beats spec, spec beats tests, tests beat code behavior. In this plan, the user's statements are the "Locked decisions".

Assertions in tests this plan gives you may not be edited to make them pass. The two existing tests this plan rewrites (Task 3 Step 1 and Task 4 Step 1) are rewritten exactly as shown, because the user changed that behavior.

Evidence rule: your report pastes the real output of every verification command (at minimum the final summary lines). "Tests pass" without output is not accepted.

Work on a branch: `git switch -c graphite-redesign` from an up-to-date `main` before Task 1. Expect `git status` to be clean first. If it is not clean, STOP and report what is dirty.

Each `npx playwright test` run rebuilds the app first (see `playwright.config.ts`), so expect 1 to 3 minutes per run. That is normal, not a hang.

### Hasty-executor traps

- Do NOT add a `<link>` to Google Fonts or a `@import url(https://...)`. The CSP blocks it in production while dev looks fine.
- Do NOT import `@fontsource/cormorant-garamond/600.css` or `700.css` (all subsets, several hundred KB precached). Import only the `latin-600.css` and `latin-700.css` files.
- Do NOT size medallions or titles with Tailwind classes when a class in `home.css` or `result.css` already sets that property. Edit the CSS file (see Global Constraints).
- Do NOT add text labels, captions, tooltips or names next to the weakness icons. Alt text on the `<img>` is the only name.
- Do NOT touch `Sheet.tsx`, `sheetDetents.ts`, chip sizing in `ResultOverlay.tsx`, or map gesture code. Decision 8 says restyle only.
- Do NOT recolor the game art, the map image, or the structure icons.
- Do NOT delete `WeaknessCard` in `NightlordMedallion.tsx`. The picker's Shifting Earth panel still uses it.
- Do NOT add a weakness filter to the Bosses page.

---

### Task 1: Graphite colors

**Files:**
- Modify: `src/ui/styles/theme.css` (the `@theme` block and the `surface` utility)
- Modify: `src/ui/map.css:63` (the `.pin-match` glow, still the old yellow `rgb(255 214 10 / …)`)
- Modify: `vite.config.ts` (manifest `background_color` and `theme_color`)
- Test: `e2e/theme.spec.ts` (new)

**Interfaces:**
- Produces tokens later tasks use: `--color-hairline` (Tailwind `shadow-[…var(--color-hairline)]`), `--color-weak-row` (Tailwind `bg-weak-row`), `--color-accent` (Tailwind `text-accent`). Existing token names keep their names, with new values.

- [ ] **Step 1: Write the failing test** in `e2e/theme.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('pages paint in Graphite', async ({ page }) => {
  await page.goto('#/nightlord/tricephalos')
  const ground = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  expect(ground).toBe('rgb(11, 11, 12)')
  const holy = page.getByRole('row', { name: /^Holy/ })
  await expect(holy.getByRole('cell')).toHaveCSS('color', 'rgb(242, 194, 110)')
  await expect(page.getByRole('row', { name: /^Madness/ }).getByRole('cell')).toHaveCSS('color', 'rgb(255, 122, 107)')
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx playwright test e2e/theme.spec.ts`
Expected: 2 failed (phone and desktop). The first failure message shows `Received: "rgb(0, 0, 0)"`.
If instead it fails on the `row` locator (not found): STOP. The table markup differs from `NumbersTable` in `src/ui/EnemyNumbers.tsx`; report it.

- [ ] **Step 3: Set the Graphite tokens in `src/ui/styles/theme.css`**

Inside `@theme`, set exactly these values and leave every other token as it is:

| Token | Value |
|---|---|
| `--color-ground` | `#0b0b0c` |
| `--color-surface` | `#18181a` |
| `--color-surface-2` | `#222224` |
| `--color-surface-3` | `#2a2a2d` |
| `--color-label` | `#f2f2f2` |
| `--color-label-2` | `#9a9aa0` |
| `--color-separator` | `#232325` |
| `--color-weak` | `#f2c26e` |
| `--color-immune` | `#ff7a6b` |
| `--color-night-1` | `#e8b45a` |
| `--color-night-2` | `#d8d8dc` |
| `--color-hairline` (new) | `#2a2a2d` |
| `--color-weak-row` (new) | `#26221a` |
| `--color-accent` (new) | `#e8b45a` |

Unchanged on purpose: `--color-label-3`, `--color-fill`, `--color-fill-strong`, `--color-highlight`, `--color-event`, and all `--glass-*` variables. They are already neutral, and the glass floats over the map.

Change the `surface` utility to a flat card: `background: var(--color-surface); box-shadow: inset 0 0 0 1px var(--color-hairline);`. Update the comment above it to say pages use flat cards and glass is for floating over the map.

- [ ] **Step 4: Recolor the match glow in `src/ui/map.css:63`**

Replace the three `rgb(255 214 10 / A)` stops with `rgb(242 194 110 / A)`, keeping each alpha (0.6, 0.22, 0) and each stop position.

- [ ] **Step 5: Set the PWA manifest colors in `vite.config.ts`**

`background_color: '#0b0b0c'` and `theme_color: '#0b0b0c'`.

- [ ] **Step 6: Run the test and see it pass**

Run: `npx playwright test e2e/theme.spec.ts`
Expected: `2 passed`.

- [ ] **Step 7: Run the whole suite so nothing else moved**

Run: `npm run check`
Expected: tsc prints nothing, Vitest ends `Tests  N passed`, Playwright ends `N passed` with `0 failed`.
If a pre-existing e2e test fails on a color value: report its name and the assertion. Do not edit it (that is an INTENT conflict). Any other failure: STOP and report.

- [ ] **Step 8: Commit**

```bash
git add src/ui/styles/theme.css src/ui/map.css vite.config.ts e2e/theme.spec.ts
git commit -m "Paint the app in Graphite: neutral greys with one amber accent" -m "<one or two sentences: why, per decision 1>"
```

---

### Task 2: Serif titles

**Files:**
- Modify: `package.json` / `package-lock.json` (via npm)
- Modify: `src/ui/main.tsx` (font imports)
- Modify: `src/ui/styles/theme.css` (`--font-display` token)
- Modify: `src/ui/Page.tsx` (h1 and `Section` h2 classes)
- Modify: `src/ui/HomeScreen.tsx` (home h1 classes)
- Modify: `src/ui/styles/home.css:8` (`.home-title`), `src/ui/styles/result.css:31` (`.result-title`)
- Test: `e2e/theme.spec.ts` (add a test)

**Interfaces:**
- Produces the Tailwind utility `font-display` (from `--font-display`). Tasks 3 and 4 use it.

- [ ] **Step 1: Write the failing test** (append to `e2e/theme.spec.ts`)

```ts
test('titles are set in the bundled serif, with no font CDN', async ({ page }) => {
  const fontHosts: string[] = []
  page.on('request', (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontHosts.push(r.url()) })
  await page.goto('#/bosses')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { name: 'Bosses', level: 1 })).toHaveCSS('font-family', /Cormorant Garamond/)
  const loaded = await page.evaluate(() => [...document.fonts].some((f) => f.family.includes('Cormorant Garamond') && f.status === 'loaded'))
  expect(loaded).toBe(true)
  expect(fontHosts).toEqual([])
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx playwright test e2e/theme.spec.ts -g "serif"`
Expected: 2 failed, on the `toHaveCSS('font-family', …)` line.

- [ ] **Step 3: Install the font**

Run: `npm install @fontsource/cormorant-garamond@^5.3.0`
Expected: `added 1 package`. Then check that `node_modules/@fontsource/cormorant-garamond/latin-600.css` and `latin-700.css` exist.
If those two files do not exist: STOP and list the `.css` files the package does contain.

- [ ] **Step 4: Import the two Latin weights in `src/ui/main.tsx`**, above `./styles/theme.css`:

```ts
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-700.css'
```

- [ ] **Step 5: Add `--font-display: "Cormorant Garamond", Georgia, serif;` to `@theme`** in `theme.css`, next to `--font-sans`.

- [ ] **Step 6: Apply the serif**

| Where | Change |
|---|---|
| `Page.tsx` h1 | add `font-display`; size `text-[40px] leading-none min-[900px]:text-[52px]` (replacing `text-[32px] leading-tight`) |
| `Page.tsx` `Section` h2 | becomes `mx-1 mb-2.5 font-display text-[22px] font-semibold text-label` (drop `text-[13px]`, `tracking-wide`, `text-label-2`, `uppercase`) |
| `HomeScreen.tsx` h1 "Nightreign" | add `font-display`; size `text-[44px] leading-none min-[900px]:text-[56px]` (replacing `text-[34px]`) |
| `home.css` `.home-title` | add `font-family: var(--font-display);`, `font-size: 40px; line-height: 1;` |
| `result.css` `.result-title` | add `font-family: var(--font-display);`, `font-size: 32px; line-height: 1;` |

- [ ] **Step 7: Run the test and see it pass**

Run: `npx playwright test e2e/theme.spec.ts`
Expected: `4 passed`.

- [ ] **Step 8: Run the whole suite**

Run: `npm run check`
Expected: all green as in Task 1 Step 7. A failure that names a heading by text means a test relied on the old uppercase look. That is an INTENT conflict: report it, do not edit the test.

- [ ] **Step 9: Commit** (`package.json`, `package-lock.json`, the files above, the test) with a subject like "Set titles in Cormorant Garamond, bundled so it works offline".

---

### Task 3: Nightlord and enemy pages

**Files:**
- Modify: `src/ui/Page.tsx` (`Page` gains `art`, `meta`, `wide`)
- Modify: `src/ui/EnemyNumbers.tsx` (delete `WeakTo`; add `WeakIcons`; `AfflictionIcon` gains `label`; `NumbersTable` titles and row tint)
- Modify: `src/ui/NightlordPages.tsx` (`NightlordPage` layout and order; the list-row helper keeps working)
- Modify: `src/ui/EnemyPage.tsx`
- Test: `e2e/reference.spec.ts` (rewrite two assertions, add tests)

**Interfaces:**
- Consumes: the `font-display`, `bg-weak-row` and `--color-hairline` tokens from Tasks 1 and 2.
- Produces:
  - `Page({ title, go, back, art, meta, wide, children }: { title: string; go: Go; back?: string; art?: string; meta?: ReactNode; wide?: boolean; children: ReactNode })`. `art` is an image URL. When it is set, the header is centered: the image at 150px (190px at ≥900px), round, with ring `shadow-[0_0_0_1px_var(--color-hairline)]`, then the h1 centered under it. `meta` renders directly under the h1 (centered when `art` is set). `wide` widens `main` from `max-w-3xl` to `max-w-5xl`.
  - `WeakIcons({ forms, named }: { forms: Form[]; named?: Affliction })` in `EnemyNumbers.tsx`. It returns `null` when there is nothing to show; otherwise `<section aria-label="Weak to" className="mt-3 flex flex-wrap gap-2">` (add `justify-center` when the caller centers it; take a `center?: boolean` prop) containing one 28px `AfflictionIcon` per lead damage weakness, then one per `verdict.weakStatuses` entry. Each icon's alt is `DAMAGE_NAMES[k]`. Compute `lead` exactly the way `WeakTo` does today (named first, then `verdict.weakTo`, falling back to `verdict.oneForm?.weakTo`). No text, no numbers, no background.
  - `AfflictionIcon({ affliction, size, label }: { affliction: Affliction; size?: number; label?: string })`, where `alt={label ?? ''}`.

- [ ] **Step 1: Rewrite the two existing assertions and add the new tests in `e2e/reference.spec.ts`**

In `"the old cheat sheet's links still open their pages"`, replace
`await expect(page.getByRole('region', { name: 'Weak to' })).toContainText('Holy')` with
`await expect(page.getByRole('region', { name: 'Weak to' }).getByRole('img', { name: 'Holy' })).toBeVisible()`.

In `"an enemy page lists the expeditions a night boss closes a night in"`, replace
`await expect(page.getByRole('region', { name: 'Weak to' })).toContainText('No damage weakness')` with
`await expect(page.getByRole('region', { name: 'Weak to' }).getByRole('img', { name: /^(Standard|Slash|Strike|Pierce|Magic|Fire|Lightning|Holy)$/ })).toHaveCount(0)`.

Write the INTENT line for both rewrites (code shows a text summary; decision 3 says icons only).

Add:

```ts
test('a Nightlord page leads with its art and weakness icons, then the tables, then the nights', async ({ page }) => {
  await page.goto('#/nightlord/tricephalos')
  await expect(page.locator('main img[src$="nightlords/tricephalos.webp"]')).toBeVisible()
  const weak = page.getByRole('region', { name: 'Weak to' })
  await expect(weak.getByRole('img', { name: 'Holy' })).toBeVisible()
  await expect(weak.getByRole('img', { name: 'Sleep' })).toBeVisible()
  await expect(weak).toHaveText('')
  expect(await page.getByRole('heading', { level: 2 }).allTextContents()).toEqual(['Damage negation', 'Status buildup', 'Night 1', 'Night 2'])
  await expect(page.getByRole('row', { name: /^Holy/ })).toHaveCSS('background-color', 'rgb(38, 34, 26)')
  await expect(page.getByRole('row', { name: /^Fire/ })).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})

test('wide number tables never push the page sideways', async ({ page }) => {
  await page.goto('#/enemy/albinauric-archers')
  await expect(page.getByRole('heading', { name: 'Damage negation' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('an enemy with no numbers says so and shows no weakness row', async ({ page }) => {
  await page.goto('#/enemy/ancestral-followers')
  await expect(page.getByText('No numbers for this one yet.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Weak to' })).toHaveCount(0)
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx playwright test e2e/reference.spec.ts`
Expected: the three new tests and the two rewritten ones fail in both projects. The rest pass. (The no-numbers test may already pass, since that page never rendered `WeakTo`. That is fine; note it in the report.)
If `albinauric-archers` or `ancestral-followers` 404s to home: STOP. The enemy data changed; report it.

- [ ] **Step 3: Implement `Page`'s `art`, `meta` and `wide`** as the Interfaces block describes. The no-`art` header stays left-aligned as today.

- [ ] **Step 4: In `EnemyNumbers.tsx`**, delete `WeakTo`, add `WeakIcons`, and give `AfflictionIcon` its `label`. In `NumbersTable`, set the two `Section` titles to `"Damage negation"` and `"Status buildup"`, and give a `<tr>` the class `bg-weak-row` when any form's value in that row satisfies `weakWhen` (immune does not count).

- [ ] **Step 5: In `NightlordPages.tsx`, `NightlordPage`** becomes:
`<Page title={nightlord.name} go={go} back="/nightlords" art={`nightlords/${id}.webp`} meta={<WeakIcons forms={nightlord.forms} named={nightlord.named} center />} wide>`
wrapping `<div className="grid items-start gap-x-7 min-[900px]:grid-cols-2">`, which contains `<NumbersTable forms={nightlord.forms} />` and then the two night `Section`s. At ≥900px that puts negation beside status and Night 1 beside Night 2.

- [ ] **Step 6: In `EnemyPage.tsx`**, pass `meta={enemy.forms.length ? <WeakIcons forms={enemy.forms} /> : undefined}` and `wide`. Wrap the tables and the Expeditions section in the same grid `div`. Remove the `WeakTo` import and use.

- [ ] **Step 7: Run and see them pass**

Run: `npx playwright test e2e/reference.spec.ts`
Expected: all pass in both projects.
If the `row … background-color` assertion fails because the tint lands on the cells and not the row: put the class on the `<tr>`, since cells are transparent. If it still fails, STOP and report the received value.

- [ ] **Step 8: Run the whole suite**

Run: `npm run check`. Expected: all green. `tsc` catches any leftover `WeakTo` import; fix it by removing the import, not by restoring `WeakTo`.

- [ ] **Step 9: Commit** with a subject like "Lead the Nightlord page with its art, and show weaknesses as icons over the full tables".

---

### Task 4: Home screen medallions and tiles

**Files:**
- Modify: `src/ui/router.ts` (`Route` `pick` gains `nightlord?`; `parseRoute`)
- Modify: `src/ui/router.test.ts`
- Modify: `src/ui/App.tsx` (pass the pick through)
- Modify: `src/ui/NightlordPicker.tsx` (export `PICKS` and `Portrait`; take `initial`)
- Modify: `src/ui/HomeScreen.tsx` (medallion row, tiles, header row on desktop)
- Modify: `src/ui/Icon.tsx` (five new icon paths)
- Modify: `src/ui/styles/home.css` (new `.home-medallion` rules)
- Test: `e2e/reference.spec.ts`

**Interfaces:**
- Consumes: `font-display`, `text-accent` and the `surface` utility from Tasks 1 and 2.
- Produces:
  - `Route` member `{ name: 'pick'; nightlord?: NightlordPick }`. `parseRoute('/find/<id>')` returns `{ name: 'pick', nightlord: id }` for any `NIGHTLORDS` id or `'unknown'`. `parseRoute('/find')` still returns exactly `{ name: 'pick' }`. Any other two-part `/find/x` returns `{ name: 'home' }`.
  - `NightlordPicker({ go, initial }: { go: Go; initial?: NightlordPick })`, with `useState<NightlordPick | null>(initial ?? null)`. App renders `<NightlordPicker key={route.nightlord ?? ''} go={go} initial={route.nightlord} />`.
  - `export const PICKS` and `export function Portrait` from `NightlordPicker.tsx` (moved to export, unchanged).
  - `IconName` gains `'moon' | 'swords' | 'relic' | 'weapon' | 'builds'` with these paths:
    - `moon`: `M12 3a7 7 0 1 0 7 9 5.5 5.5 0 0 1-7-9z`
    - `swords`: `M4 20L20 4M14 4h6v6M4 14l6 6M7 17l-3 3`
    - `relic`: `M12 3l7 5-2.5 9h-9L5 8z`
    - `weapon`: `M14.5 4.5l5 5L9 20H4v-5z`
    - `builds`: `M4 7h16M4 12h16M4 17h10`

- [ ] **Step 1: Write the failing tests**

In `src/ui/router.test.ts`, `describe('routes')`:

```ts
it('opens the picker with a Nightlord already chosen', () => {
  expect(parseRoute('/find/augur')).toEqual({ name: 'pick', nightlord: 'augur' })
  expect(parseRoute('/find/unknown')).toEqual({ name: 'pick', nightlord: 'unknown' })
  expect(parseRoute('/find/nobody')).toEqual({ name: 'home' })
})
```

In `e2e/reference.spec.ts`, replace the test `'Find My Seed opens the Nightlord picker'` entirely (INTENT line: the code has a Find My Seed link; decision 6 replaces it with medallions):

```ts
test('a Nightlord on home opens the picker with it chosen', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Find My Seed' })).toBeVisible()
  await page.getByRole('link', { name: 'Augur', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Choose your Nightlord' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Augur', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Shifting Earth' })).toBeVisible()
})

test('Unknown on home opens the picker with Unknown chosen', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Unknown', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Unknown', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Shifting Earth' })).toBeVisible()
})

test('home never scrolls sideways and links every section', async ({ page }) => {
  await page.goto('./')
  for (const name of ['Nightlords', 'Bosses', 'Relic Effects', 'Weapon Effects', 'Builds']) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/ui/router.test.ts` → the new `it` fails (`/find/augur` gives `{ name: 'home' }`).
Run: `npx playwright test e2e/reference.spec.ts -g "home"` → the three new tests fail.

- [ ] **Step 3: Router, App and picker changes** per the Interfaces block. In `parseRoute`, add the two-part `/find/<pick>` branch next to the existing `parts.length === 1` branch.

- [ ] **Step 4: Home screen** (only the not-searching branch changes; search results stay as they are):
  - Header: `h1` and `SearchField` stack on phones. At ≥900px they sit in one row: `min-[900px]:flex-row min-[900px]:items-center`, with the search box `min-[900px]:w-[380px]`. `main` goes from `max-w-3xl` to `max-w-5xl`.
  - Replace the `find-my-seed` `<a>` card with `<section aria-labelledby="find-heading">`: `<h2 id="find-heading" className="font-display text-[26px] font-semibold min-[900px]:text-[32px]">Find My Seed</h2>`, then a `<ul>` of `PICKS`, each an `<a href={`#/find/${id}`}>` holding `<span className="home-medallion"><Portrait id={id} name={name} /></span>` and the name. On phones the list is one row that scrolls sideways (`flex gap-3.5 overflow-x-auto -mx-4 px-4`, each item `w-20 shrink-0 text-center text-[12px]`). At ≥900px it becomes a wrapping grid (`min-[900px]:grid min-[900px]:grid-cols-[repeat(auto-fill,minmax(88px,1fr))] min-[900px]:overflow-visible min-[900px]:mx-0 min-[900px]:px-0`, names 13px).
  - In `home.css`, add `.home-medallion { display: block; width: 72px; aspect-ratio: 1; margin: 0 auto 8px; border-radius: 50%; overflow: hidden; box-shadow: 0 0 0 1px var(--color-hairline); }` and, in the existing ≥900px media block style, `.home-medallion { width: 84px; }`.
  - Replace the `Group` of `LinkRow`s with a grid of tiles: `grid grid-cols-2 gap-3 min-[900px]:grid-cols-5`. Each tile is `<a className="surface flex h-[108px] flex-col justify-between rounded-[18px] p-4 min-[900px]:h-[120px]">` with `<Icon name=… className="text-accent" />` and the label in `font-display text-[22px] font-semibold`. Builds gets `col-span-2 min-[900px]:col-span-1`. Map labels to icons: Nightlords→`moon`, Bosses→`swords`, Relic Effects→`relic`, Weapon Effects→`weapon`, Builds→`builds`.
  - Keep the About link at the bottom.
  - Delete the now-unused `find-my-seed` markup. Before deleting any CSS rule that names it, check `grep -rn "find-my-seed" src e2e scripts`. If a test or script still uses it, report that instead of deleting.

- [ ] **Step 5: Run and see them pass**

Run: `npx vitest run src/ui/router.test.ts` → all pass.
Run: `npx playwright test e2e/reference.spec.ts` → all pass in both projects.
If `getByRole('link', { name: 'Augur', exact: true })` matches 0 elements: the link's accessible name is not exactly the Nightlord name (check that the `Portrait` img has `alt=""`). Fix the markup, not the test.

- [ ] **Step 6: Run the whole suite**

Run: `npm run check`. Expected: all green.
If another e2e test clicked the old "Find My Seed" link and now fails: write the INTENT line, then change only its navigation step to `page.goto('#/find')`. Any other failure: STOP.

- [ ] **Step 7: Commit** with a subject like "Start a seed search from the home screen's Nightlord medallions".

---

### Task 5: Screenshots and final check

**Files:**
- Modify: `scripts/screens.ts` (stale base URL and home shot)

The screenshot script is stale. It uses a non-hash base without the `/nightreign-cheatsheet/` path, and its `home-picked` shot clicks a button that no longer exists.

- [ ] **Step 1: Fix the script.** Set `const base = 'http://localhost:4173/nightreign-cheatsheet/#'`. Change the `home-picked` shot to `await p.goto(`${base}/find/tricephalos`)`. Change nothing else.

- [ ] **Step 2: Build, serve and shoot**

Run: `npm run build`, then `npm run preview` in the background, then `npm run screens -- graphite`.
Expected: PNGs in `docs/specs/screens/iter-graphite/`, named `phone-<shot>.png` and `desktop-<shot>.png`.
If a shot other than `home` and `home-picked` throws (old selectors such as `'Unknown site'` may be stale): report the shot name and the error, and keep the PNGs that were made. This is not a blocker and not something to fix in this plan.
Stop the preview server afterwards.

- [ ] **Step 3: Take the screens the script does not cover.** For both projects' viewports (390×844 and 1440×900), use Playwright to capture full-page shots of `#/`, `#/nightlord/tricephalos`, `#/bosses`, `#/enemy/albinauric-archers` and `#/seed/000` into the same folder.

- [ ] **Step 4: Compare against the mockup** (link in the header). For each shot, write one line in the report: "matches" or the specific difference. Colors, the serif, the icon row under the Nightlord name, table-then-nights order, the medallion row and the tiles are what to check. Do not fix differences found here. Report them.

- [ ] **Step 5: Final full run**

Run: `npm run check`. Paste the last 15 lines.

- [ ] **Step 6: Commit** `scripts/screens.ts`. Do not commit the PNGs unless `git log -- docs/specs/screens` shows earlier iterations were committed; follow whichever the history does.

---

## Handback contract

Your report contains, in this order:

1. The branch name and `git log --oneline main..HEAD`.
2. Files touched (`git diff --stat main...HEAD`).
3. For each task: the pasted output of its "see it fail" and "see it pass" runs (summary lines are enough), and the pasted final `npm run check` output from Task 5.
4. Every INTENT line you wrote.
5. Deviations from this plan. Expected: none. For each: what, why, and which branch or STOP led to it.
6. Task 5's mockup comparison lines and the screenshot folder path.
7. Open questions, including anything you wanted to add helper text for (decision 10).

The plan's author reviews this report before the work is accepted. Do not merge or push.
