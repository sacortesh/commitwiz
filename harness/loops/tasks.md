# Task List

## Phase 1 — Core CLI Scaffold
[X] Init single-file Node.js CLI entry point with `npx` support (`bin` field, shebang, no deps)
[ ] Implement branch parser: extract `issueTag` and `issuePrefix` from `rawBranchName`
[ ] Implement git utils: read current branch, list changed files with status



## Phase 2 — Interactive Prompt Session (requires Phase 1)
[ ] Build step-by-step prompt loop: type → scope → description → issueTag confirm
[ ] Add commit type selector (feat | fix | chore | docs | refactor) with arrow-key nav via raw stdin
[ ] Add edit mode: allow user to go back and revise any field before confirming



## Phase 3 — Commit Message Assembly & Validation (requires Phase 2)
[ ] Build `CommitMessage` formatter: `type(scope): description [ISSUE-123]`
[ ] Add size-check warning: count changed files, warn if >10 files in one commit
[ ] Preview formatted message and require explicit confirmation before running `git commit`


## Phase 4 — Distribution & DX Polish (requires Phase 3)
[ ] Add bash wrapper script for `commitwiz` alias with fallback to `npx`
[ ] Write `--help` output and `--dry-run` flag (print message, skip git commit)
[ ] Publish package to npm, verify `npx commitwiz` works in a fresh repo



