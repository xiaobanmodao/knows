# Task 1 Report: Physics Topic Framework Evidence Checker

## Implementation

- Added `scripts/check-physics-topic-framework-evidence.js`.
- Exposes `checkPhysicsTopicFrameworkEvidence({ evidencePath } = {})`; `evidencePath` is test-only injectable and defaults to `docs/evidence/physics-topic-framework-review-2026.json`.
- Reads evidence with `fs.readFileSync` and `JSON.parse`, then validates the fixed review ID and evidence kind, two registered official sources, four explicit exclusions, six current topic IDs/titles, nonempty `frameworkDomains`, and current review snapshot hashes.
- Rejects claims using `chapterTitle`, `chapterOrder`, or `volumeMapping` field names at any depth.
- Read failures, including absent files, are reported as `物理专题官方框架佐证记录读取失败`.
- Added a focused contract test that passes a unique nonexistent `options.evidencePath` and asserts this error boundary. It does not create evidence data or exercise the future Task 2 success path.

## RED Evidence

Command:

```sh
node scripts/check-physics-topic-framework-evidence.test.js
```

Initial RED summary: exit `1`; the checker module did not exist (`MODULE_NOT_FOUND`).

After rewriting the test to the latest contract, RED summary: exit `1`; the existing implementation threw `缺少物理专题官方框架佐证记录` instead of the required `物理专题官方框架佐证记录读取失败` message.

## Current Expected Red Condition

The Task 1 contract test is green. The default checker command intentionally remains red until Task 2 creates `docs/evidence/physics-topic-framework-review-2026.json`:

```sh
node scripts/check-physics-topic-framework-evidence.js
```

Observed output: `FOUND_PHYSICS_TOPIC_FRAMEWORK_EVIDENCE_ISSUE: 物理专题官方框架佐证记录读取失败：docs/evidence/physics-topic-framework-review-2026.json（ENOENT）` (exit `1`). No evidence JSON, external-source manifest, content-source-input, quality matrix, runtime content, page, or subpackage was created or changed.

## Verification

```sh
node scripts/check-physics-topic-framework-evidence.test.js
# OK physics topic framework evidence contract
# exit 0

node --check scripts/check-physics-topic-framework-evidence.js
node --check scripts/check-physics-topic-framework-evidence.test.js
git diff --check
# all exit 0
```

## Changed Files

- `scripts/check-physics-topic-framework-evidence.js`
- `scripts/check-physics-topic-framework-evidence.test.js`
- `.superpowers/sdd/2026-08-10-physics-topic-framework-evidence/task-1-report.md`

## Commit

Implementation commit: `8459ba2dae9caf1f24bd329061b783dc65cc54b8` (`feat(check): add physics framework evidence checker`).

## Self-Check / Concerns

- `isAllowedContentSourceUrl` is called with `getContentSource(source.key)` and `source.url`, never with a source-key string.
- The contract test validates only the missing-file error boundary requested for Task 1. Task 2 must supply a record matching the exact schema enforced by the checker before the default CLI can succeed.

## Fix Round 1/5

### Finding and Change

- Fixed invalid JSON handling in `readEvidence`: `JSON.parse` failures now use the same `物理专题官方框架佐证记录读取失败` prefix as missing-file failures and retain the original parser message and input path.
- Added an invalid-JSON temporary-file case to the focused contract test. The test creates the file under the system temporary directory and removes it in `finally`; it does not create an evidence record.

### RED / GREEN

RED command:

```sh
node scripts/check-physics-topic-framework-evidence.test.js
```

RED output summary: exit `1`; the invalid JSON case received `物理专题官方框架佐证记录不是有效 JSON：Expected property name or '}' in JSON at position 2 (line 1 column 3)`, which did not match the required `物理专题官方框架佐证记录读取失败` prefix.

GREEN commands:

```sh
node scripts/check-physics-topic-framework-evidence.test.js
# OK physics topic framework evidence contract
# exit 0

node --check scripts/check-physics-topic-framework-evidence.js
node --check scripts/check-physics-topic-framework-evidence.test.js
git diff --check
# all exit 0
```

### Files and SHA

- `scripts/check-physics-topic-framework-evidence.js`
- `scripts/check-physics-topic-framework-evidence.test.js`
- `.superpowers/sdd/2026-08-10-physics-topic-framework-evidence/task-1-report.md`

Fix commit: `ad87816b42169d7274aba09bd253d2dac87a7c40` (`fix(check): wrap invalid physics evidence JSON errors`).
