# Architecture Rules

- Single file: all logic lives in `commitwiz.js`, no splitting into modules.
- Zero dependencies: use only Node.js built-ins (`readline`, `child_process`, `process`).
- Bash wrapper (`commitwiz.sh`) handles only PATH/shebang concerns — no logic.
- Separate pure functions from I/O: parse branch, compose message, and validate inputs as plain functions.
- Never mutate state: pass data forward through a single pipeline object.
- Validate early: enforce constraints (72-char limit, enum types) before prompting the next step.
- Fail loudly on `git` errors: surface `stderr` and exit non-zero; never swallow failures.
- Keep prompts sequential: one `readline` question at a time, no concurrent async branches.

---

## Branching Strategy

- main branch: `main` — production-ready, tagged releases only
- development branch: `dev` — integration target for all feature work
- feature branches: `feature/<issue>-<short-desc>` (e.g. `feature/42-add-scope-prompt`)
- bugfix branches: `bugfix/<issue>-<short-desc>` (e.g. `bugfix/17-fix-regex-parse`)
- hotfix branches: `hotfix/<issue>-<short-desc>` — branch off `main`, merge into both `main` and `dev`
- chore branches: `chore/<short-desc>` (e.g. `chore/update-readme`)
- merge target (features/bugfixes): `dev` via PR/MR
- merge target (releases): `dev` → `main` via tagged merge commit
- release tagging: `v<semver>` on `main` (e.g. `v1.2.0`)
- hotfix approach: branch from `main`, fix, open PR to `main`, cherry-pick or merge back into `dev`
- branch protection: `main` requires passing CI + 1 review; `dev` requires passing CI
- no long-lived branches beyond `main` and `dev`
- issue detection: branch names follow `feature/<issue>-*` pattern, aligning with commitwiz's own regex

Base branch: main

