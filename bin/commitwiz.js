#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');

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
