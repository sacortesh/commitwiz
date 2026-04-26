# Task Spec: Implement git utils: read current branch, list changed files with status

Slug: implement-git-utils--read-current-branch--list-cha
Branch: task/implement-git-utils--read-current-branch--list-cha
Created: 2026-04-26

---

## BDD Acceptance Criteria

Feature: Git Utils

  Scenario: Read current branch name
    Given a valid git repository exists
    When `getCurrentBranch()` is called
    Then it returns the active branch name as a non-empty string

  Scenario: Extract issue tag from branch name
    Given the current branch is named `feature/GLOMO-123-add-login`
    When `parseBranchMeta()` is called
    Then it returns `{ branchName: "feature/GLOMO-123-add-login", issueTag: "GLOMO-123", issuePrefix: "GLOMO" }`

  Scenario: List changed files with status
    Given a git repo has one modified file, one added file, and one deleted file staged or unstaged
    When `getChangedFiles()` is called
    Then it returns an array of `{ path, status }` objects with statuses `modified`, `added`, and `deleted`

  Scenario: Handle branch with no issue tag
    Given the current branch is named `main`
    When `parseBranchMeta()` is called
    Then it returns `{ branchName: "main", issueTag: null, issuePrefix: null }`

---

## Notes

<!-- Human notes appended here during execute-task.sh iterations -->
