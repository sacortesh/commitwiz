#!/usr/bin/env bash
# check.sh — harness sensor aggregator
# Add checks below as new task types are encountered.
run_check "Selector source file exists"        bash -c 'ls src/selector.js src/commitTypeSelector.js src/ui/selector.js 2>/dev/null | grep -q .'
run_check "Commit types defined in source"     bash -c 'grep -r "feat.*fix\|fix.*feat" src/ --include="*.js" -l | grep -q .'
run_check "All 5 commit types present"         bash -c 'grep -rh "feat\|fix\|chore\|docs\|refactor" src/ --include="*.js" | grep -qE "(feat|fix|chore|docs|refactor)" && node -e "const src=require(\"fs\").readFileSync(require(\"fs\").readdirSync(\"src\").find(f=>f.match(/select/i))?\"src/\"+require(\"fs\").readdirSync(\"src\").find(f=>f.match(/select/i)):\"\",\"utf8\"); [\"feat\",\"fix\",\"chore\",\"docs\",\"refactor\"].forEach(t=>{if(!src.includes(t))process.exit(1)})"'
run_check "Raw stdin / keypress handling"      bash -c 'grep -r "setRawMode\|process.stdin.setRawMode\|readline\|keypress" src/ --include="*.js" -l | grep -q .'
run_check "Arrow key codes handled"            bash -c 'grep -r "\\\\x1b\[A\|\\\\u001b\[A\|ArrowUp\|ARROW_UP\|\\\\x1B\[B\|ArrowDown" src/ --include="*.js" -l | grep -q .'

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
