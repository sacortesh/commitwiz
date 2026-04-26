#!/usr/bin/env bash
# commit.sh — AI-assisted focused commit
# Called internally by execute-task.sh and closure-task.sh.
# Scopes commit to changed files and proposes a message via Claude.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

require_git_repo

# ── Detect changed files ───────────────────────────────────────────────────────
header "Commit"
divider

# Get all modified/untracked files
CHANGED_FILES=$(git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard)
CHANGED_FILES=$(echo "$CHANGED_FILES" | sort -u | grep -v '^$' || true)

if [[ -z "$CHANGED_FILES" ]]; then
  info "No changed files detected. Nothing to commit."
  exit 0
fi

info "Changed files:"
echo "$CHANGED_FILES" | while read -r f; do echo "  $f"; done
echo

# ── Task scope check ───────────────────────────────────────────────────────────
CURRENT_BRANCH=$(current_branch)
TASK_NAME="${CURRENT_BRANCH#task/}"

# Ask AI if any files look out of scope
OUT_OF_SCOPE=$("$SCRIPT_DIR/claude.sh" \
  "Current task branch: ${CURRENT_BRANCH}
Changed files:
${CHANGED_FILES}

Are any of these files likely outside the scope of this task?
- out_of_scope: list any suspicious files, or 'none'
- reason: brief explanation")

SUSPECT=$(echo "$OUT_OF_SCOPE" | grep -i '^out_of_scope:' | sed 's/out_of_scope: *//')

if [[ -n "$SUSPECT" && "$SUSPECT" != "none" ]]; then
  warn "Possible out-of-scope files detected:"
  echo "  ${SUSPECT}"
  echo
  if ! yes_no "Proceed with commit anyway?"; then
    info "Commit aborted. Review the files and re-run."
    exit 0
  fi
fi

# ── Generate commit message ────────────────────────────────────────────────────
info "Generating commit message..."

DIFF_SUMMARY=$(git diff HEAD --stat 2>/dev/null || git diff --cached --stat 2>/dev/null || echo "$CHANGED_FILES")

COMMIT_MSG=$("$SCRIPT_DIR/claude.sh" \
  "Suggest a focused git commit message for these changes.
Branch: ${CURRENT_BRANCH}
Files changed:
${DIFF_SUMMARY}

Rules:
- Format: '<type>: <short description>' (e.g. 'feat: add recipe list endpoint')
- Types: feat, fix, test, refactor, docs, chore, style
- Max 72 characters
- No period at end
- Imperative mood (add, fix, update — not added/fixed/updated)")

# Strip any extra lines — use first line only
COMMIT_MSG=$(echo "$COMMIT_MSG" | head -1 | sed 's/^["`'"'"']//;s/["`'"'"']$//')

divider
info "Proposed message: ${COMMIT_MSG}"
divider

ask FINAL_MSG "Commit message (edit if needed)" "$COMMIT_MSG"

# ── Stage and commit ───────────────────────────────────────────────────────────
info "Staging files..."
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if [[ -f "$file" ]]; then
    git add "$file"
    echo "  staged: $file"
  else
    # File deleted
    git rm --cached "$file" 2>/dev/null || true
    echo "  removed: $file"
  fi
done <<< "$CHANGED_FILES"

echo
info "Committing..."
git commit -m "$(cat <<EOF
$FINAL_MSG
EOF
)"

success "Committed: ${FINAL_MSG}"
echo
