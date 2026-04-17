# Plan: git commit + tag + deploy to GitHub

## Context

Working tree is **already clean** — the Enter framework auto-committed all recent changes.

Latest local commit: `3b6057d` (refactor(audit): enhance detail rendering and styling)  
Last pushed to `github/main`: `ccadf9b` (feat(collective): add collective health dashboard)  
Last tag: `v2.46.5` → 5 commits behind HEAD

Commits to push (since last github/main push, newest first):
```
3b6057d  refactor(audit): enhance detail rendering and styling
0cfb743  chore: remove old files and refactor UI navigation
57ad5e5  code changed by agent
7277a60  feat(audit): enhance audit card details display
8bcb011  code changed by agent
c24bbed  feat(models): add Claude Opus 4.7 and GPT 5.4 models
...      (many commits between v2.33.0–v2.46.5 not yet on github/main)
```

## Steps

### 1. Create annotated tag v2.47.0 at HEAD

```bash
git tag -a v2.47.0 HEAD \
  -m "feat: audit card UI overhaul + project cleanup

- refactor(audit): BulletLine smart rendering (badge/pair/default modes)
- refactor(audit): filename code-tags, dynamic score colors, wider cards
- chore: remove 44 redundant files (scripts, docs, retrospectives)
- refactor(app): HASH_TO_PAGE/PAGE_TO_HASH lookup maps
- refactor(chat): extract doSend() helper, dynamic footer model name
- fix(data): update verify-results.json line counts"
```

### 2. Push main branch + all tags to github

```bash
git push github main --tags
```

Remote is already configured:
`github → https://...@github.com/xinetzone/DaoMind.git`

## Files Modified

None — this is a pure git operation, no code changes.

## Verification

After push:
- `git log github/main -1` should show `3b6057d`
- `git tag --list "v2.47.0"` should exist
- GitHub repo at `xinetzone/DaoMind` should reflect latest commits and new tag
