#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');

// Named constants for branch parsing
const ISSUE_TAG_PATTERN = /(?:^|\/)((?:[A-Z][-A-Z]*[A-Z]-)?\d+)(?:-|$)/;
const PREFIXED_ISSUE_TAG_PATTERN = /(?:^|\/)([A-Z][-A-Z]*[A-Z]-\d+)(?:-|$)/;

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
 * Returns a list of changed files with their status.
 * @returns {Array<{ path: string, status: string }>}
 */
function getChangedFiles() {
  const output = execSync('git status --porcelain', { encoding: 'utf8' });
  return output
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      const xy = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      const code = xy.trim()[0];
      const status = STATUS_MAP[code] || 'modified';
      return { path: filePath, status };
    });
}

module.exports = { parseBranch, getCurrentBranch, parseBranchMeta, getChangedFiles };

function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch (_) {
    return false;
  }
}

if (!isGitRepo()) {
  process.stderr.write('Error: not a git repository. Run commitwiz inside a git repo.\n');
  process.exit(1);
}

process.stdout.write('commitwiz — interactive commit message composer\n');
process.stdout.write('Run without --help to start the prompt session.\n');
