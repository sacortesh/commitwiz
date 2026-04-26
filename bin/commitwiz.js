#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const readline = require('readline');

// Named constants for branch parsing
const ISSUE_TAG_PATTERN = /(?:^|\/)((?:[A-Z][-A-Z]*[A-Z]-)?\d+)(?:-|$)/;
const PREFIXED_ISSUE_TAG_PATTERN = /(?:^|\/)([A-Z][-A-Z]*[A-Z]-\d+)(?:-|$)/;

const COMMIT_TYPES = ['feat', 'fix', 'chore', 'docs', 'refactor'];

/**
 * Parses a raw branch name and extracts issueTag and issuePrefix.
 * @param {string} rawBranchName
 * @returns {{ issueTag: string|null, issuePrefix: string|null }}
 */
function parseBranch(rawBranchName) {
  const prefixedMatch = rawBranchName.match(PREFIXED_ISSUE_TAG_PATTERN);
  if (prefixedMatch) {
    const issueTag = prefixedMatch[1];
    const issuePrefix = issueTag.replace(/-\d+$/, '');
    return { issueTag, issuePrefix };
  }

  const numericMatch = rawBranchName.match(ISSUE_TAG_PATTERN);
  if (numericMatch) {
    return { issueTag: numericMatch[1], issuePrefix: null };
  }

  return { issueTag: null, issuePrefix: null };
}

/**
 * Returns the current git branch name.
 * @returns {string}
 */
function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
}

/**
 * Returns branch metadata including the parsed issue tag and prefix.
 * @returns {{ branchName: string, issueTag: string|null, issuePrefix: string|null }}
 */
function parseBranchMeta() {
  const branchName = getCurrentBranch();
  const { issueTag, issuePrefix } = parseBranch(branchName);
  return { branchName, issueTag, issuePrefix };
}

const STATUS_MAP = { M: 'modified', A: 'added', D: 'deleted', '?': 'added' };

/**
 * Parses the output of `git status --porcelain` into an array of { path, status } objects.
 * @param {string} porcelainOutput
 * @returns {Array<{ path: string, status: string }>}
 */
function parseGitStatus(porcelainOutput) {
  return porcelainOutput
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      const xy = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      const code = xy[0] !== ' ' ? xy[0] : xy[1];
      const status = STATUS_MAP[code] || 'modified';
      return { path: filePath, status };
    });
}

/**
 * Returns a list of changed files with their status.
 * @returns {Array<{ path: string, status: string }>}
 */
function getChangedFiles() {
  const output = execSync('git status --porcelain', { encoding: 'utf8' });
  return parseGitStatus(output);
}

/**
 * Assembles a conventional commit message from session fields.
 * @param {{ type: string, scope: string, description: string, issueTag: string|null }} opts
 * @returns {string}
 */
function buildCommitMessage({ type, scope, description, issueTag }) {
  const scopePart = scope ? `(${scope})` : '';
  const tagPart = issueTag ? ` [${issueTag}]` : '';
  return `${type}${scopePart}: ${description}${tagPart}`;
}

module.exports = {
  parseBranch,
  getCurrentBranch,
  parseBranchMeta,
  getChangedFiles,
  parseGitStatus,
  buildCommitMessage,
  COMMIT_TYPES,
};

// ── Interactive CLI ────────────────────────────────────────────────────────────

function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Wraps rl.question as a Promise. Resolves with null on EOF/close.
 * @param {readline.Interface} rl
 * @param {string} prompt
 * @returns {Promise<string|null>}
 */
function question(rl, prompt) {
  return new Promise((resolve) => {
    let resolved = false;
    const closeHandler = () => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    };
    rl.once('close', closeHandler);
    rl.question(prompt, (answer) => {
      if (!resolved) {
        resolved = true;
        rl.removeListener('close', closeHandler);
        resolve(answer);
      }
    });
  });
}

/**
 * Prompts the user to select a commit type from COMMIT_TYPES.
 * @param {readline.Interface} rl
 * @returns {Promise<string|null>}
 */
async function promptType(rl) {
  process.stdout.write('\nSelect commit type:\n');
  COMMIT_TYPES.forEach((t, i) => process.stdout.write(`  ${i + 1}) ${t}\n`));
  while (true) {
    const answer = await question(rl, `Type [1-${COMMIT_TYPES.length}]: `);
    if (answer === null) return null;
    const idx = parseInt(answer.trim(), 10) - 1;
    if (idx >= 0 && idx < COMMIT_TYPES.length) return COMMIT_TYPES[idx];
    const direct = answer.trim().toLowerCase();
    if (COMMIT_TYPES.includes(direct)) return direct;
    process.stdout.write(`  Invalid selection. Choose 1-${COMMIT_TYPES.length} or type a value.\n`);
  }
}

/**
 * Prompts the user to enter an optional scope.
 * @param {readline.Interface} rl
 * @returns {Promise<string|null>}
 */
async function promptScope(rl) {
  const answer = await question(rl, 'Scope (optional, press Enter to skip): ');
  if (answer === null) return null;
  return answer.trim();
}

/**
 * Prompts the user to enter a commit description.
 * @param {readline.Interface} rl
 * @returns {Promise<string|null>}
 */
async function promptDescription(rl) {
  while (true) {
    const answer = await question(rl, 'Description: ');
    if (answer === null) return null;
    const desc = answer.trim();
    if (desc.length > 0) return desc;
    process.stdout.write('  Description cannot be empty.\n');
  }
}

/**
 * Prompts the user to confirm or override the issue tag pre-filled from the branch.
 * @param {readline.Interface} rl
 * @param {string|null} prefilled
 * @returns {Promise<string|null>}
 */
async function promptIssueTag(rl, prefilled) {
  const hint = prefilled ? ` [${prefilled}]` : '';
  const answer = await question(rl, `Issue tag${hint} (Enter to confirm, or type to override): `);
  if (answer === null) return null;
  const val = answer.trim();
  return val.length > 0 ? val : (prefilled || '');
}

/**
 * Runs the step-by-step commit prompt loop.
 * @param {readline.Interface} rl
 * @returns {Promise<void>}
 */
async function runPromptLoop(rl) {
  const { issueTag: branchIssueTag } = parseBranchMeta();

  const session = { type: '', scope: '', description: '', issueTag: branchIssueTag || '' };

  // Initial pass through all steps
  const type = await promptType(rl);
  if (type === null) return;
  session.type = type;

  const scope = await promptScope(rl);
  if (scope === null) return;
  session.scope = scope;

  const description = await promptDescription(rl);
  if (description === null) return;
  session.description = description;

  const issueTag = await promptIssueTag(rl, branchIssueTag);
  if (issueTag === null) return;
  session.issueTag = issueTag;

  // Confirmation loop with edit support
  while (true) {
    const message = buildCommitMessage(session);
    process.stdout.write(`\nFormatted message: ${message}\n`);
    const action = await question(rl, 'Confirm? [y/edit/n]: ');
    if (action === null || action.trim().toLowerCase() === 'n') {
      process.stdout.write('Aborted.\n');
      return;
    }

    if (action.trim().toLowerCase() === 'y') {
      process.stdout.write(`\nFinal commit message: ${message}\n`);
      return;
    }

    if (action.trim().toLowerCase() === 'edit') {
      const field = await question(rl, 'Edit which field? [type/scope/description/issueTag]: ');
      if (field === null) return;
      const f = field.trim().toLowerCase();
      if (f === 'type') {
        const newType = await promptType(rl);
        if (newType === null) return;
        session.type = newType;
      } else if (f === 'scope') {
        const newScope = await promptScope(rl);
        if (newScope === null) return;
        session.scope = newScope;
      } else if (f === 'description') {
        const newDesc = await promptDescription(rl);
        if (newDesc === null) return;
        session.description = newDesc;
      } else if (f === 'issuetag') {
        const newTag = await promptIssueTag(rl, branchIssueTag);
        if (newTag === null) return;
        session.issueTag = newTag;
      } else {
        process.stdout.write('  Unknown field. Use type, scope, description, or issueTag.\n');
      }
    }
  }
}

async function main() {
  if (!isGitRepo()) {
    process.stderr.write('Error: not a git repository. Run commitwiz inside a git repo.\n');
    process.exit(1);
  }

  if (process.argv.includes('--help')) {
    process.stdout.write('commitwiz — interactive commit message composer\n');
    process.stdout.write('Usage: commitwiz\n');
    process.stdout.write('Run inside a git repository to start the interactive prompt.\n');
    return;
  }

  // Non-interactive stdin: skip prompt loop
  if (!process.stdin.isTTY) {
    process.stdout.write('commitwiz — interactive commit message composer\n');
    process.stdout.write('Run in an interactive terminal to start the prompt session.\n');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write('commitwiz — interactive commit message composer\n');

  try {
    await runPromptLoop(rl);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
