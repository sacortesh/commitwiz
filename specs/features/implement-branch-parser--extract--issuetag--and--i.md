# Task Spec: Implement branch parser: extract `issueTag` and `issuePrefix` from `rawBranchName`

Slug: implement-branch-parser--extract--issuetag--and--i
Branch: task/implement-branch-parser--extract--issuetag--and--i
Created: 2026-04-26

---

## BDD Acceptance Criteria

Feature: Branch parser extracts issue metadata from branch name

  Scenario: Branch contains prefixed issue tag
    Given a rawBranchName of "feature/GLOMO-123-add-login"
    When the branch parser runs
    Then issueTag is "GLOMO-123" and issuePrefix is "GLOMO"

  Scenario: Branch contains numeric-only issue tag
    Given a rawBranchName of "fix/123-fix-crash"
    When the branch parser runs
    Then issueTag is "123" and issuePrefix is null

  Scenario: Branch contains no issue tag
    Given a rawBranchName of "main" or "feature/add-login"
    When the branch parser runs
    Then issueTag is null and issuePrefix is null

  Scenario: Branch contains issue tag with multi-part prefix
    Given a rawBranchName of "chore/MY-PROJ-456-update-deps"
    When the branch parser runs
    Then issueTag is "MY-PROJ-456" and issuePrefix is "MY-PROJ"

---

## Notes

<!-- Human notes appended here during execute-task.sh iterations -->
