# Task Spec: Init single-file Node.js CLI entry point with `npx` support (`bin` field, shebang, no deps)

Slug: init-single-file-node-js-cli-entry-point-with--npx
Branch: task/init-single-file-node-js-cli-entry-point-with--npx
Created: 2026-04-25

---

## BDD Acceptance Criteria

Feature: Single-file Node.js CLI entry point with npx support

  Scenario: Run via npx in a git repo
    Given a published npm package with a `bin` field pointing to `bin/commitwiz.js`
    When a developer runs `npx commitwiz` in a git repository
    Then the CLI starts without error and prints a welcome or prompt message

  Scenario: Shebang enables direct execution
    Given `bin/commitwiz.js` has `#!/usr/bin/env node` as its first line
    When the file is executed directly as `./bin/commitwiz.js`
    Then Node.js interprets and runs it without requiring `node` prefix

  Scenario: Zero dependencies on install
    Given the `package.json` has an empty or absent `dependencies` field
    When `npm install` is run
    Then no third-party packages are downloaded into `node_modules`

  Scenario: CLI exits cleanly outside a git repo
    Given the working directory is not a git repository
    When a developer runs `npx commitwiz`
    Then the CLI prints an error message and exits with a non-zero code

---

## Notes

<!-- Human notes appended here during execute-task.sh iterations -->
