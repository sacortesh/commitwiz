# Task Spec: Implement branch parser: extract `issueTag` and `issuePrefix` from `rawBranchName`

Slug: implement-branch-parser--extract--issuetag--and--i
Branch: task/implement-branch-parser--extract--issuetag--and--i
Created: 2026-04-26

---

## BDD Acceptance Criteria

Feature: Branch Parser

  Scenario: Extract issueTag and issuePrefix from standard branch name
    Given a rawBranchName of "feature/GLOMO-123-add-login"
    When the branch parser runs
    Then issuePrefix is "GLOMO" and issueTag is "GLOMO-123"

  Scenario: Extract issueTag from branch with numeric-only suffix
    Given a rawBranchName of "fix/PROJ-456-fix-null-crash"
    When the branch parser runs
    Then issuePrefix is "PROJ" and issueTag is "PROJ-456"

  Scenario: Return null when branch name contains no issue pattern
    Given a rawBranchName of "main" or "feature/add-login"
    When the branch parser runs
    Then issuePrefix is null and issueTag is null

  Scenario: Handle branch name where issue tag appears at start
    Given a rawBranchName of "GLOMO-789-refactor-auth"
    When the branch parser runs
    Then issuePrefix is "GLOMO" and issueTag is "GLOMO-789"

---

## Notes

<!-- Human notes appended here during execute-task.sh iterations -->
