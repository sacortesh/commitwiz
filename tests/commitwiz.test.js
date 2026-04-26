#!/usr/bin/env node
'use strict';

const assert = require('assert');
const EventEmitter = require('events');
const {
  parseBranch,
  parseGitStatus,
  buildCommitMessage,
  COMMIT_TYPES,
  isGitRepo,
  question,
  promptType,
  promptScope,
  promptDescription,
  promptIssueTag,
  runPromptLoop,
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

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

/**
 * Creates a mock readline interface backed by scripted answers.
 * When answers run out the mock emits 'close' to simulate EOF.
 */
function makeMockRl(answers) {
  const emitter = new EventEmitter();
  let idx = 0;
  emitter.question = (prompt, cb) => {
    const ans = answers[idx];
    if (ans === undefined) {
      emitter.emit('close');
      return;
    }
    idx++;
    setImmediate(() => cb(ans));
  };
  emitter.close = () => {};
  return emitter;
}

/** Silences process.stdout.write for the duration of fn, returns captured output. */
async function captureStdout(fn) {
  const chunks = [];
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (msg) => { chunks.push(msg); return true; };
  try {
    await fn();
  } finally {
    process.stdout.write = orig;
  }
  return chunks.join('');
}

(async () => {
  // ── parseBranch ──────────────────────────────────────────────────────────────

  test('parseBranch: prefixed tag extracted from feature branch', () => {
    const r = parseBranch('feature/GLOMO-123-add-login');
    assert.strictEqual(r.issueTag, 'GLOMO-123');
    assert.strictEqual(r.issuePrefix, 'GLOMO');
  });

  test('parseBranch: fix/PROJ-42 → issueTag=PROJ-42, issuePrefix=PROJ', () => {
    const r = parseBranch('fix/PROJ-42-fix-null-pointer');
    assert.strictEqual(r.issueTag, 'PROJ-42');
    assert.strictEqual(r.issuePrefix, 'PROJ');
  });

  test('parseBranch: numeric-only tag → issueTag with no prefix', () => {
    const r = parseBranch('123-fix-bug');
    assert.strictEqual(r.issueTag, '123');
    assert.strictEqual(r.issuePrefix, null);
  });

  test('parseBranch: main → both null', () => {
    const r = parseBranch('main');
    assert.strictEqual(r.issueTag, null);
    assert.strictEqual(r.issuePrefix, null);
  });

  // ── buildCommitMessage ───────────────────────────────────────────────────────

  test('buildCommitMessage: type+scope+description+issueTag → full format', () => {
    const r = buildCommitMessage({ type: 'feat', scope: 'auth', description: 'add login endpoint', issueTag: 'GLOMO-123' });
    assert.strictEqual(r, 'feat(auth): add login endpoint [GLOMO-123]');
  });

  test('buildCommitMessage: no scope → omits parens', () => {
    const r = buildCommitMessage({ type: 'feat', scope: '', description: 'add login endpoint', issueTag: 'GLOMO-123' });
    assert.strictEqual(r, 'feat: add login endpoint [GLOMO-123]');
    assert.ok(!r.includes('()'));
  });

  test('buildCommitMessage: null issueTag → omits tag', () => {
    const r = buildCommitMessage({ type: 'fix', scope: '', description: 'typo fix', issueTag: null });
    assert.strictEqual(r, 'fix: typo fix');
    assert.ok(!r.includes('['));
  });

  test('buildCommitMessage: empty issueTag → omits tag', () => {
    const r = buildCommitMessage({ type: 'chore', scope: 'ci', description: 'update pipeline', issueTag: '' });
    assert.strictEqual(r, 'chore(ci): update pipeline');
  });

  test('buildCommitMessage: all fields → conventional format', () => {
    const r = buildCommitMessage({ type: 'refactor', scope: 'db', description: 'extract query builder', issueTag: 'PROJ-7' });
    assert.ok(r.startsWith('refactor(db): extract query builder'));
    assert.ok(r.includes('PROJ-7'));
  });

  // ── COMMIT_TYPES ─────────────────────────────────────────────────────────────

  test('COMMIT_TYPES is an array with required types', () => {
    assert.ok(Array.isArray(COMMIT_TYPES));
    assert.ok(COMMIT_TYPES.includes('feat'));
    assert.ok(COMMIT_TYPES.includes('fix'));
    assert.ok(COMMIT_TYPES.includes('chore'));
    assert.ok(COMMIT_TYPES.includes('docs'));
    assert.ok(COMMIT_TYPES.includes('refactor'));
  });

  // ── parseGitStatus ───────────────────────────────────────────────────────────

  test('parseGitStatus: staged M → modified', () => {
    const r = parseGitStatus('M  modified.js\n');
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].status, 'modified');
    assert.strictEqual(r[0].path, 'modified.js');
  });

  test('parseGitStatus: staged D → deleted', () => {
    const r = parseGitStatus('D  deleted.js\n');
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].status, 'deleted');
  });

  test('parseGitStatus: staged A → added', () => {
    const r = parseGitStatus('A  added.js\n');
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].status, 'added');
  });

  test('parseGitStatus: untracked ?? → added', () => {
    const r = parseGitStatus('?? new.js\n');
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].status, 'added');
  });

  test('parseGitStatus: unstaged M in second column → modified', () => {
    const r = parseGitStatus(' M modified.js\n');
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].status, 'modified');
  });

  test('parseGitStatus: unknown status code → fallback modified', () => {
    const r = parseGitStatus('X  file.js\n');
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].status, 'modified');
  });

  test('parseGitStatus: empty input → empty array', () => {
    const r = parseGitStatus('');
    assert.strictEqual(r.length, 0);
  });

  test('parseGitStatus: mixed entries → correct count and statuses', () => {
    const r = parseGitStatus('D  del.js\n M mod.js\n?? new.js\n');
    assert.strictEqual(r.length, 3);
    assert.strictEqual(r[0].status, 'deleted');
    assert.strictEqual(r[1].status, 'modified');
    assert.strictEqual(r[2].status, 'added');
  });

  // ── isGitRepo ────────────────────────────────────────────────────────────────

  test('isGitRepo: returns boolean true inside a git repo', () => {
    const result = isGitRepo();
    assert.strictEqual(typeof result, 'boolean');
    assert.strictEqual(result, true);
  });

  // ── question ─────────────────────────────────────────────────────────────────

  await testAsync('question: resolves with the provided answer', async () => {
    const rl = makeMockRl(['my answer']);
    const result = await question(rl, 'prompt: ');
    assert.strictEqual(result, 'my answer');
  });

  await testAsync('question: resolves with null on EOF (close event)', async () => {
    const rl = makeMockRl([]);
    const result = await question(rl, 'prompt: ');
    assert.strictEqual(result, null);
  });

  // ── promptType ───────────────────────────────────────────────────────────────

  await testAsync('promptType: numeric 1 → first commit type', async () => {
    const rl = makeMockRl(['1']);
    const result = await captureStdout(async () => {
      const r = await promptType(rl);
      assert.strictEqual(r, COMMIT_TYPES[0]);
    });
    assert.ok(result.includes('Select commit type'));
  });

  await testAsync('promptType: type name "fix" → returns fix', async () => {
    const rl = makeMockRl(['fix']);
    await captureStdout(async () => {
      const r = await promptType(rl);
      assert.strictEqual(r, 'fix');
    });
  });

  await testAsync('promptType: uppercase type name → returns lowercase', async () => {
    const rl = makeMockRl(['FEAT']);
    await captureStdout(async () => {
      const r = await promptType(rl);
      assert.strictEqual(r, 'feat');
    });
  });

  await testAsync('promptType: invalid input then valid number → loops to valid', async () => {
    const rl = makeMockRl(['99', '2']);
    await captureStdout(async () => {
      const r = await promptType(rl);
      assert.strictEqual(r, COMMIT_TYPES[1]);
    });
  });

  await testAsync('promptType: EOF → returns null', async () => {
    const rl = makeMockRl([]);
    await captureStdout(async () => {
      const r = await promptType(rl);
      assert.strictEqual(r, null);
    });
  });

  // ── promptScope ──────────────────────────────────────────────────────────────

  await testAsync('promptScope: text → returns trimmed value', async () => {
    const rl = makeMockRl(['  auth  ']);
    await captureStdout(async () => {
      const r = await promptScope(rl);
      assert.strictEqual(r, 'auth');
    });
  });

  await testAsync('promptScope: empty enter → returns empty string (optional skip)', async () => {
    const rl = makeMockRl(['']);
    await captureStdout(async () => {
      const r = await promptScope(rl);
      assert.strictEqual(r, '');
    });
  });

  await testAsync('promptScope: EOF → returns null', async () => {
    const rl = makeMockRl([]);
    await captureStdout(async () => {
      const r = await promptScope(rl);
      assert.strictEqual(r, null);
    });
  });

  // ── promptDescription ────────────────────────────────────────────────────────

  await testAsync('promptDescription: non-empty text → returns description', async () => {
    const rl = makeMockRl(['add login endpoint']);
    await captureStdout(async () => {
      const r = await promptDescription(rl);
      assert.strictEqual(r, 'add login endpoint');
    });
  });

  await testAsync('promptDescription: empty then text → loops until non-empty', async () => {
    const rl = makeMockRl(['', 'add login endpoint']);
    await captureStdout(async () => {
      const r = await promptDescription(rl);
      assert.strictEqual(r, 'add login endpoint');
    });
  });

  await testAsync('promptDescription: EOF → returns null', async () => {
    const rl = makeMockRl([]);
    await captureStdout(async () => {
      const r = await promptDescription(rl);
      assert.strictEqual(r, null);
    });
  });

  // ── promptIssueTag ───────────────────────────────────────────────────────────

  await testAsync('promptIssueTag: empty answer with prefilled → returns prefilled', async () => {
    const rl = makeMockRl(['']);
    await captureStdout(async () => {
      const r = await promptIssueTag(rl, 'PROJ-42');
      assert.strictEqual(r, 'PROJ-42');
    });
  });

  await testAsync('promptIssueTag: typed override replaces prefilled', async () => {
    const rl = makeMockRl(['GLOMO-99']);
    await captureStdout(async () => {
      const r = await promptIssueTag(rl, 'PROJ-42');
      assert.strictEqual(r, 'GLOMO-99');
    });
  });

  await testAsync('promptIssueTag: no prefilled and empty answer → empty string', async () => {
    const rl = makeMockRl(['']);
    await captureStdout(async () => {
      const r = await promptIssueTag(rl, null);
      assert.strictEqual(r, '');
    });
  });

  await testAsync('promptIssueTag: EOF → returns null', async () => {
    const rl = makeMockRl([]);
    await captureStdout(async () => {
      const r = await promptIssueTag(rl, 'PROJ-42');
      assert.strictEqual(r, null);
    });
  });

  // ── runPromptLoop ────────────────────────────────────────────────────────────

  await testAsync('runPromptLoop: complete flow outputs formatted message', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login endpoint', '', 'y']);
    const out = await captureStdout(() => runPromptLoop(rl));
    assert.ok(out.includes('feat(auth): add login endpoint'), `Got: ${out}`);
  });

  await testAsync('runPromptLoop: skipping scope omits parens in output', async () => {
    const rl = makeMockRl(['1', '', 'add login endpoint', '', 'y']);
    const out = await captureStdout(() => runPromptLoop(rl));
    assert.ok(out.includes('feat: add login endpoint'));
    assert.ok(!out.includes('feat(): '));
  });

  await testAsync('runPromptLoop: confirm with n aborts and writes Aborted', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'n']);
    const out = await captureStdout(() => runPromptLoop(rl));
    assert.ok(out.includes('Aborted'));
  });

  await testAsync('runPromptLoop: confirm with null (EOF) aborts', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '']);
    // answers exhaust at the confirm prompt → EOF → action = null → abort
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: edit type then confirm produces updated message', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'type', '2', 'y']);
    const out = await captureStdout(() => runPromptLoop(rl));
    assert.ok(out.includes('fix(auth): add login'), `Got: ${out}`);
  });

  await testAsync('runPromptLoop: edit scope then confirm updates scope', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'scope', 'api', 'y']);
    const out = await captureStdout(() => runPromptLoop(rl));
    assert.ok(out.includes('feat(api): add login'), `Got: ${out}`);
  });

  await testAsync('runPromptLoop: edit description then confirm updates description', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'description', 'updated desc', 'y']);
    const out = await captureStdout(() => runPromptLoop(rl));
    assert.ok(out.includes('feat(auth): updated desc'), `Got: ${out}`);
  });

  await testAsync('runPromptLoop: edit issueTag then confirm updates tag', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'issueTag', 'PROJ-99', 'y']);
    const out = await captureStdout(() => runPromptLoop(rl));
    assert.ok(out.includes('[PROJ-99]'), `Got: ${out}`);
  });

  await testAsync('runPromptLoop: edit unknown field prints error then confirms', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'unknown', 'y']);
    const out = await captureStdout(() => runPromptLoop(rl));
    assert.ok(out.includes('Unknown field'));
  });

  await testAsync('runPromptLoop: EOF at type step exits cleanly', async () => {
    const rl = makeMockRl([]);
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: EOF at scope step exits cleanly', async () => {
    const rl = makeMockRl(['1']);
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: EOF at description step exits cleanly', async () => {
    const rl = makeMockRl(['1', 'auth']);
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: EOF at issueTag step exits cleanly', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login']);
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: EOF at edit field prompt exits cleanly', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit']);
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: EOF after edit type prompt exits cleanly', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'type']);
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: EOF after edit scope prompt exits cleanly', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'scope']);
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: EOF after edit description prompt exits cleanly', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'description']);
    await captureStdout(() => runPromptLoop(rl));
  });

  await testAsync('runPromptLoop: EOF after edit issueTag prompt exits cleanly', async () => {
    const rl = makeMockRl(['1', 'auth', 'add login', '', 'edit', 'issueTag']);
    await captureStdout(() => runPromptLoop(rl));
  });

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
