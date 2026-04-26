# Task Spec: Build step-by-step prompt loop: type → scope → description → issueTag confirm

Slug: build-step-by-step-prompt-loop--type---scope---des
Branch: task/build-step-by-step-prompt-loop--type---scope---des
Created: 2026-04-26

---

## BDD Acceptance Criteria

Feature: Step-by-step commit prompt loop

  Scenario: User completes all steps in order
    Given a git repo with staged changes and branch "feature/GLOMO-123-add-login"
    When the user runs `commitwiz` and selects type "feat", enters scope "auth", enters description "add login endpoint", and confirms issue tag "GLOMO-123"
    Then the CLI outputs `feat(auth): add login endpoint [GLOMO-123]` and asks for final confirmation

  Scenario: Issue tag is auto-extracted from branch name
    Given a git repo with branch "fix/PROJ-42-fix-null-pointer"
    When the user reaches the issueTag step
    Then the CLI pre-fills "PROJ-42" and allows the user to confirm or override it

  Scenario: User skips optional scope
    Given a git repo with staged changes
    When the user leaves the scope prompt blank and completes remaining steps
    Then the CLI outputs a message without scope (e.g. `feat: add login endpoint [GLOMO-123]`)

  Scenario: User edits a previous step before confirming
    Given the user has completed all four steps
    When the user selects "edit" at the confirmation prompt and changes the type to "fix"
    Then the CLI re-runs only the type step, preserves other answers, and re-displays the updated formatted message

  Scenario: Agent assembles test battery infrastructure
    Given the agent has coded enough
    When the agent finishes new testable tasks
    Then the agent implements unit testing, 
    and adds the running logic into the sensors

---

## Notes

<!-- Human notes appended here during execute-task.sh iterations -->

## Rejection Notes — 2026-04-26

i want the unit tests to use the coverage tool, enforce coverage of 80% for lines and branches. also some sensors are overcoverded with the tests. so they can be cleaned up
