# Coding Rules

- `.js`: Use CommonJS (`require`/`module.exports`), add `#!/usr/bin/env node` shebang on line 1, keep all logic in one file, use `async/await` over callbacks
- `.js`: Validate all user input immediately after prompt; exit with `process.exit(1)` on any unrecoverable error
- `.js`: Use `child_process.execSync` with `{ encoding: 'utf8' }` for git commands; wrap in try/catch for clean error messages
- `.js`: No external runtime dependencies — stdlib only (`readline`, `child_process`, `process`)
- `.js`: Named constants at top of file for regex patterns (e.g. `ISSUE_PATTERN = /(\w+-\d+|\d+)/`)
- `.js`: Max line length 100 chars; use early returns to avoid deep nesting
- `.sh`: Use `#!/usr/bin/env bash` shebang; set `set -euo pipefail` on line 2
- `.sh`: Resolve script dir with `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`
- `.sh`: Quote all variables (`"$VAR"`); never use unquoted expansions
- `.sh`: Wrapper only — no business logic; delegate entirely to `node commitwiz.js "$@"`
- `.json` (`package.json`): Set `"bin": { "commitwiz": "./commitwiz.js" }` for `npx` support
- `.json`: Pin `"engines": { "node": ">=18" }`; set `"type": "commonjs"` explicitly

