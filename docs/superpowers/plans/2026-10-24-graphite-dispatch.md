# Graphite Redesign: Subagent Dispatch

Executes `docs/superpowers/plans/2026-10-24-graphite-redesign.md` (the "task plan") with superpowers:subagent-driven-development. The task plan is the spec. This file only says who runs what, in what order, and where the controller checks.

## Shape

One implementer subagent per task, run one after another on a single branch, `graphite-redesign`. The controller (main session) reviews each handback before dispatching the next task.

Nothing runs in parallel. Each task builds on the last (2 needs 1's tokens; 3 and 4 need 2's `font-display`; 2, 3 and 4 all touch `Page.tsx`, `HomeScreen.tsx` or `e2e/reference.spec.ts`). Playwright also serves on a fixed port 4173 with `reuseExistingServer: false`, so two worktrees running `npm run check` at once would collide. Splitting 3 and 4 into worktrees saves little and costs a merge plus a port fight.

## Step 0: controller, before any dispatch

1. `docs/` is untracked on `main`, so the task plan's "git status must be clean" rule would STOP the first subagent. Commit `docs/` to `main` first (subject like "Add the Graphite redesign plan"), with the user's go-ahead.
2. `git switch -c graphite-redesign`. The controller does this, not Task 1's subagent, so the branch exists once.
3. Confirm no preview server is already on port 4173.

## Dispatch table

| # | Subagent | Task plan section | Controller gate before next dispatch |
|---|---|---|---|
| 1 | implementer (general-purpose) | Task 1: Graphite colors | Fail then pass output for `e2e/theme.spec.ts` pasted; `npm run check` green; one commit; diff touches only the four listed files |
| 2 | implementer | Task 2: Serif titles | Only `latin-600.css` and `latin-700.css` imported; no Google Fonts host anywhere (`grep -rn "fonts.g" src index.html vite.config.ts` empty); `4 passed` on theme spec |
| 3 | implementer | Task 3: Nightlord and enemy pages | Both rewritten assertions carry INTENT lines; `WeakTo` gone, `WeaknessCard` still present; no text next to icons; `npm run check` green |
| 4 | implementer | Task 4: Home medallions and tiles | Router unit test pasted; `/find/unknown` e2e passes; any change to another test's navigation step has an INTENT line; `find-my-seed` grep result reported |
| 5 | implementer | Task 5: Screenshots and final check | Final `npm run check` last 15 lines; mockup comparison line per shot; preview server stopped |
| 6 | reviewer (superpowers:requesting-code-review) | whole branch, `main...graphite-redesign` | Checks the ten Locked decisions and the "Hasty-executor traps" list against the diff, plus the five Review Focus items |

## Prompt for each implementer

Each subagent starts cold, so every prompt gets the same frame. Fill in `<N>` and the task title.

```
You are implementing Task <N> (<title>) of
docs/superpowers/plans/2026-10-24-graphite-redesign.md, in
C:\Users\justi\dev\nightreign\nightreign-cheatsheet, on the existing branch
graphite-redesign. Tasks 1..<N-1> are already committed.

Read these sections of the plan before touching code: "Locked decisions",
"Global Constraints", "Rules for the executor" (including "Hasty-executor
traps"), then Task <N> only. Do not start any other task.

Follow Task <N>'s steps in order. The STOP rule and INTENT gate apply. Do not
edit test assertions the plan gives you. Do not push or merge.

Report back, in this order: `git log --oneline -1`, `git diff --stat HEAD~1`,
pasted output of the fail run, the pass run and `npm run check` (summary lines),
every INTENT line, any deviation and why, open questions.
```

Task 5's prompt adds: "Write PNGs under docs/specs/screens/iter-graphite/."

## Controller rules

- A STOP or INTENT conflict in a handback goes to the user. The controller does not resolve it and does not tell the subagent to push past it.
- A handback without pasted command output is rejected and the same subagent is asked for it (SendMessage), not re-dispatched.
- If a gate fails on something small and in-scope (a missed file, a leftover import), send it back to the same subagent. If it fails on scope (a new feature, helper text, touched `Sheet.tsx`), revert that commit and re-dispatch with the violation named.
- After step 6, the controller hands the user the task plan's handback contract items 1 to 7, built from the five handbacks plus the review.
