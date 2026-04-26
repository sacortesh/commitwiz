# Task Spec: Init single-file Node.js CLI entry point with `npx` support (`bin` field, shebang, no deps)

Slug: init-single-file-node-js-cli-entry-point-with--npx--support---bin--field--shebang--no-deps-
Branch: task/init-single-file-node-js-cli-entry-point-with--npx--support---bin--field--shebang--no-deps-
Created: 2026-04-25

---

## BDD Acceptance Criteria

Feature: Single-file Node.js CLI entry point with npx support

  Scenario: Run CLI via npx without local install
    Given a published package with a `bin` field pointing to `cli.js`
    When a user runs `npx commitwiz` in any directory
    Then the CLI starts without errors and prints a welcome or prompt

  Scenario: Shebang enables direct execution
    Given `cli.js` has `#!/usr/bin/env node` as its first line
    When the file is executed directly via `./cli.js`
    Then Node.js interprets and runs the file without specifying `node` explicitly

  Scenario: No external dependencies are required
    Given `package.json` has an empty or absent `dependencies` field
    When `npm install` is run in the project
    Then no packages are downloaded and the CLI still runs successfully

  Scenario: CLI exits cleanly when not inside a git repo
    Given a directory with no `.git` folder
    When the user runs `npx commitwiz`
    Then the CLI prints a clear error message and exits with a non-zero code

---

## Notes

<!-- Human notes appended here during execute-task.sh iterations -->
