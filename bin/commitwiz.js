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

module.exports = { parseBranch };

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
