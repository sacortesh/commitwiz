#!/usr/bin/env node
'use strict';

const assert = require('assert');
const {
  parseBranch,
  parseGitStatus,
  buildCommitMessage,
  COMMIT_TYPES,
} = require('../bin/commitwiz.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

// parseBranch
test('parseBranch: prefixed tag extracted', () => {
  const r = parseBranch('feature/GLOMO-123-add-login');
  assert.strictEqual(r.issueTag, 'GLOMO-123');
  assert.strictEqual(r.issuePrefix, 'GLOMO');
});

test('parseBranch: fix/PROJ-42 → issueTag=PROJ-42, issuePrefix=PROJ', () => {
  const r = parseBranch('fix/PROJ-42-fix-null-pointer');
  assert.strictEqual(r.issueTag, 'PROJ-42');
  assert.strictEqual(r.issuePrefix, 'PROJ');
});

test('parseBranch: numeric-only branch → issueTag, no prefix', () => {
  const r = parseBranch('123-fix-bug');
  assert.strictEqual(r.issueTag, '123');
  assert.strictEqual(r.issuePrefix, null);
});

test('parseBranch: main → nulls', () => {
  const r = parseBranch('main');
  assert.strictEqual(r.issueTag, null);
  assert.strictEqual(r.issuePrefix, null);
});

// buildCommitMessage
test('buildCommitMessage: type+scope+description+issueTag → full format', () => {
  const r = buildCommitMessage({ type: 'feat', scope: 'auth', description: 'add login endpoint', issueTag: 'GLOMO-123' });
  assert.strictEqual(r, 'feat(auth): add login endpoint [GLOMO-123]');
});

test('buildCommitMessage: no scope → omits parens', () => {
  const r = buildCommitMessage({ type: 'feat', scope: '', description: 'add login endpoint', issueTag: 'GLOMO-123' });
  assert.strictEqual(r, 'feat: add login endpoint [GLOMO-123]');
  assert.ok(!r.includes('()'));
});

test('buildCommitMessage: no issueTag → omits tag', () => {
  const r = buildCommitMessage({ type: 'fix', scope: '', description: 'typo fix', issueTag: null });
  assert.strictEqual(r, 'fix: typo fix');
  assert.ok(!r.includes('['));
});

test('buildCommitMessage: no issueTag empty string → omits tag', () => {
  const r = buildCommitMessage({ type: 'chore', scope: 'ci', description: 'update pipeline', issueTag: '' });
  assert.strictEqual(r, 'chore(ci): update pipeline');
});

test('buildCommitMessage: all fields → conventional format', () => {
  const r = buildCommitMessage({ type: 'refactor', scope: 'db', description: 'extract query builder', issueTag: 'PROJ-7' });
  assert.ok(r.startsWith('refactor(db): extract query builder'));
  assert.ok(r.includes('PROJ-7'));
});

// COMMIT_TYPES
test('COMMIT_TYPES is an array', () => {
  assert.ok(Array.isArray(COMMIT_TYPES));
});

test('COMMIT_TYPES includes feat', () => {
  assert.ok(COMMIT_TYPES.includes('feat'));
});

test('COMMIT_TYPES includes fix', () => {
  assert.ok(COMMIT_TYPES.includes('fix'));
});

test('COMMIT_TYPES includes chore, docs, refactor', () => {
  assert.ok(COMMIT_TYPES.includes('chore'));
  assert.ok(COMMIT_TYPES.includes('docs'));
  assert.ok(COMMIT_TYPES.includes('refactor'));
});

// parseGitStatus
test('parseGitStatus: staged M → modified', () => {
  const r = parseGitStatus('M  modified.js\n');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].status, 'modified');
});

test('parseGitStatus: staged D → deleted', () => {
  const r = parseGitStatus('D  deleted.js\n');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].status, 'deleted');
});

test('parseGitStatus: untracked ?? → added', () => {
  const r = parseGitStatus('?? new.js\n');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].status, 'added');
});

// Summary
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
