# Task 3 Report: Quality Matrix Framework Evidence

## RED

1. Added the matrix contract assertion for `scripts/check-physics-topic-framework-evidence.test.js` before registering the command.
2. Ran `node scripts/check-v1.11-quality-matrix.test.js`.
3. Observed the expected `AssertionError`: the default matrix did not contain `scripts/check-physics-topic-framework-evidence.test.js`.

## GREEN

Registered only `scripts/check-physics-topic-framework-evidence.test.js` beside the existing physics review checks in the default v1.11 quality matrix. The matrix now contains 117 checks.

Focused verification:

```text
node scripts/check-v1.11-quality-matrix.test.js
OK v1.11 quality matrix contract

node scripts/check-physics-topic-framework-evidence.test.js
OK physics topic framework evidence contract

node scripts/check-roadmap-document-consistency.test.js
OK roadmap document consistency contract

git diff --check
exit 0
```

## Documentation Boundary

- The six physics topics have `official-framework-support` build-time evidence from official references.
- This is supplementary framework evidence, not an `external-source` batch.
- It does not alter the 23-batch real external-material intake status, `content-source-follow-up` status, release blockers, or the `math-chapters-v1.11` requirement for a complete current official directory.
- The source review record and v1.11 roadmap were updated. The general roadmap received the same minimal synchronization only because its existing consistency contract requires the matrix count to match.

## Changed Files

- `scripts/check-v1.11-quality-matrix.js`
- `scripts/check-v1.11-quality-matrix.test.js`
- `docs/v1.11五科学科高风险字段复核记录.md`
- `docs/v1.11后续开发路线.md`
- `docs/后续开发与发布路线.md` (authorized minimal consistency update)

## SHA

Implementation commit: `b32079be47f5652687c445f2343b4d26c527ca87` (`test(quality): register physics framework evidence`).

## Fix Round 1/5

### Review Scope and Text Check

The existing roadmap consistency contract checked both the matrix count and the wording `当前质量矩阵 \`117/117\``. It did not independently distinguish a registered command from a fully executed matrix, so the contract was adjusted before the document correction.

| Location | Before | After |
|---|---|---|
| `docs/后续开发与发布路线.md` | A separate physics `official-framework-support` bullet appeared in the general roadmap. | The bullet is removed. The only Task 3 synchronization in this document is the required `117` matrix-count update. |
| `docs/v1.11后续开发路线.md` | `当前质量矩阵 \`117/117\` 通过` | `默认质量矩阵现登记 117 项` |
| `scripts/check-roadmap-document-consistency.test.js` | Required the `117/117` result wording. | Requires `默认质量矩阵现登记 117 项`, matching the factual registration state. |

### RED and GREEN

After changing the contract first, `node scripts/check-roadmap-document-consistency.test.js` failed with:

```text
AssertionError [ERR_ASSERTION]: 路线文档应准确说明默认质量矩阵登记了 117 项
```

After the two document edits, the focused commands produced:

```text
node scripts/check-v1.11-quality-matrix.test.js
OK v1.11 quality matrix contract

node scripts/check-physics-topic-framework-evidence.test.js
OK physics topic framework evidence contract

node scripts/check-roadmap-document-consistency.test.js
OK roadmap document consistency contract

git diff --check
exit 0
```

### Fix SHA

`e6766663a525dade492bc66e0d0f9033fb9d5946` (`docs(roadmap): correct matrix registration status`)
