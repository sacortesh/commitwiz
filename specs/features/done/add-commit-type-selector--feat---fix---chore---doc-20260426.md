# Task Spec: Add commit type selector (feat | fix | chore | docs | refactor) with arrow-key nav via raw stdin

Slug: add-commit-type-selector--feat---fix---chore---doc
Branch: task/add-commit-type-selector--feat---fix---chore---doc
Created: 2026-04-26

---

## BDD Acceptance Criteria

Feature: Commit type selector with arrow-key navigation

  Scenario: User navigates and selects a commit type
    Given the CLI is running in a git repo with staged changes
    When the commit type prompt is displayed with options [feat, fix, chore, docs, refactor]
    Then the first option (feat) is highlighted and the user can press DOWN arrow to move to the next option

  Scenario: Arrow-key navigation wraps around the list
    Given the commit type selector is active and "refactor" is highlighted (last item)
    When the user presses the DOWN arrow key
    Then the highlight moves to "feat" (first item)

  Scenario: User confirms selection with Enter
    Given the commit type selector is active and "fix" is highlighted
    When the user presses Enter
    Then the selected type "fix" is stored in CommitInput.type and the CLI advances to the next prompt

  Scenario: Selector reads raw stdin without requiring Enter for navigation
    Given the terminal is set to raw mode via process.stdin
    When the user presses UP or DOWN arrow keys
    Then the highlight updates immediately without buffering or requiring an additional Enter keypress

---

## Notes

<!-- Human notes appended here during execute-task.sh iterations -->
