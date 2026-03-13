# Merge Conflict Resolution Guide (for this repo)

## Why conflicts are happening now

Conflicts increased after the modular refactor because one PR changed the same high-churn files that `main` also changed:

- `public/index.html`
- `public/js/app.js`

When both branches edit overlapping line ranges, GitHub cannot auto-merge and marks conflicts. This is expected for large refactors.

## Why it did not happen earlier

Earlier PRs were smaller and touched fewer shared lines, so Git could merge automatically more often.

## Safe conflict resolution workflow

Run these commands locally (not in the GitHub web editor):

```bash
git fetch origin
git checkout <your-branch>
git rebase origin/main
```

If you prefer merge instead of rebase:

```bash
git fetch origin
git checkout <your-branch>
git merge origin/main
```

Then resolve conflicts in this order:

1. `public/index.html` (head links + script order)
2. `public/js/app.js` (bootstrap/init flow)

After resolving:

```bash
git add public/index.html public/js/app.js
git rebase --continue   # or git commit if using merge
git push --force-with-lease  # if rebase
```

## Important: do NOT use “Accept both changes” blindly

In this project, “Accept both” can duplicate tags and break startup (for example duplicate stylesheet/script entries with different paths).

Instead:

- Keep one canonical stylesheet path: `./styles/base.css`.
- Keep one canonical manifest path: `./manifest.json`.
- Keep one script loading strategy (prefer the current sequential loader block in `index.html` unless intentionally replacing it).
- Ensure `app.js` loads after core/feature/ui modules.

## Quick post-merge sanity checks

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/public/index.html` and verify:

- Clock advances every second (not `00:00:00`)
- No console errors
- Converter/calendar/alarm views switch correctly

## Prevention tips for future PRs

- Rebase on `origin/main` before opening PR.
- Avoid mixing refactor + feature changes in the same PR.
- Keep PRs small (e.g., one module group at a time).
- If changing `index.html`, avoid unrelated formatting edits.
