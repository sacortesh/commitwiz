#!/usr/bin/env bash
# check.sh — harness sensor aggregator
# Add checks below as new task types are encountered.

set -euo pipefail

# macOS: add GNU coreutils to PATH if timeout is not available (brew install coreutils)
if ! command -v timeout &>/dev/null && [[ -d /usr/local/opt/coreutils/libexec/gnubin ]]; then
  export PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"
fi

PASS=0
FAIL=0

run_check() {
  local name="$1"; shift
  local exit_code=0
  timeout 10s "$@" </dev/null &>/dev/null || exit_code=$?
  if [[ $exit_code -eq 124 ]]; then
    echo "  ✗ ${name}  [TIMEOUT — command is blocking]"
    ((FAIL++)) || true
  elif [[ $exit_code -eq 0 ]]; then
    echo "  ✓ ${name}"; ((PASS++)) || true
  else
    echo "  ✗ ${name}  [exit $exit_code]"
    ((FAIL++)) || true
  fi
}

echo "Running sensors..."

# ── Add sensors below this line ────────────────────────────────────────────────
# Example: run_check "Unit tests" npm test
# Example: run_check "Lint" npm run lint
# Example: run_check "Typecheck" npx tsc --noEmit

run_check "git remote origin exists"         bash -c 'git remote get-url origin'
run_check "remote origin points to github"   bash -c 'git remote get-url origin | grep -q "github.com"'

run_check "package.json has bin field"       node -e "const p=require('./package.json'); if(!p.bin) process.exit(1)"
run_check "CLI entry file has shebang"       bash -c 'head -1 $(node -e "const p=require(\"./package.json\"); console.log(Object.values(p.bin||{})[0] || p.bin)") | grep -q "#!/usr/bin/env node"'
run_check "CLI entry file is executable"     bash -c 'test -x $(node -e "const p=require(\"./package.json\"); console.log(Object.values(p.bin||{})[0] || p.bin)")'
run_check "CLI runs without error"           bash -c 'node $(node -e "const p=require(\"./package.json\"); console.log(Object.values(p.bin||{})[0] || p.bin)") --help || true; node $(node -e "const p=require(\"./package.json\"); console.log(Object.values(p.bin||{})[0] || p.bin)")'
run_check "No runtime dependencies"         node -e "const p=require('./package.json'); const d=p.dependencies; if(d && Object.keys(d).length>0) process.exit(1)"
run_check "Unit tests pass with coverage"   npm test

# ── End sensors ────────────────────────────────────────────────────────────────

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"
[[ $FAIL -eq 0 ]]
