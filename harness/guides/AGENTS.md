# Agent Instructions

You are working inside the Avangarde Harness.

Before every coding session:
1. Read `harness/loops/tasks.md` — identify the current task and branch.
2. Read `harness/guides/architecture.md` — respect every rule listed.
3. Read `harness/guides/coding-rules.md` — apply file-type rules.
4. Read the spec file in `specs/features/` for the current task.

During coding:
- Stay within the scope of the current task.
- After every change, run `harness/sensors/check.sh`.
- If the same sensor fails twice, stop and surface the issue to the human.

Never:
- Modify files outside the current task scope without explicit approval.
- Skip or comment out sensor checks.
- Introduce code that is not covered by the current BDD spec.

