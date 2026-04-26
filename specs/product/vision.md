# Vision

- **What it is:** A zero-dependency Node.js CLI (`commitwiz`) that guides developers through composing Conventional Commits-compliant messages interactively
- **Who it serves:** Individual developers and teams who commit directly from the terminal and want consistent, traceable commit history without memorizing conventions
- **Core outcome:** Every commit is typed, scoped, sized-checked, and linked to an issue number — automatically extracted from the branch name, no extra effort
- **Key differentiator:** Single-file, no framework, no install required — runs instantly via `npx commitwiz` in any git repo on any machine
- **Team outcome:** Uniform commit logs that feed cleanly into changelogs, release notes, and issue trackers without enforcing a CI gate or pre-commit hook

---

## Tech Stack

node js cli with bash wrapper for easy use

---

## Data Model

- CommitInput: type, description, scope, issueTag, rawBranchName, changedFiles[]
- CommitType: value (feat | fix | chore | docs | refactor)
- CommitMessage: formatted (e.g. `feat(auth): add login endpoint [GLOMO-123]`), confirmed
- BranchMeta: branchName, issueTag (nullable), issuePrefix (nullable, e.g. `GLOMO`)
- ChangedFile: path, status (modified | added | deleted)
- UserPromptSession: currentStep, responses{}, editMode (bool)

---

## Constraints and Non-Goals

None specified.

