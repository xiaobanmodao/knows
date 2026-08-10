const { validateReleaseToolStateEvidence } = require('./release-tool-state-evidence');

const STATUS_SCHEMA_VERSION = 1;

function cloneNextActions(actions) {
  if (!Array.isArray(actions)) return [];
  return actions
    .filter((action) => action && typeof action === 'object')
    .map((action) => ({
      id: action.id || null,
      instruction: action.instruction || String(action.message || ''),
    }))
    .filter((action) => action.instruction);
}

function buildReleaseBlocker(report, reportPath) {
  if (!report) {
    return {
      id: 'release-tool-state',
      priority: 'P0',
      message: `未找到开发者工具状态报告：${reportPath || '(未指定)'}`,
      nextActions: [{
        id: 'generate-tool-state',
        instruction: '先运行 check-release-tool-state.js 生成开发者工具状态报告。',
      }],
    };
  }

  const check = validateReleaseToolStateEvidence(report);
  if (check.valid) return null;
  return {
    id: 'release-tool-state',
    priority: 'P0',
    message: `开发者工具状态未 ready：${check.issues.join('；')}`,
    nextActions: cloneNextActions(report.blocker && report.blocker.nextActions),
  };
}

function buildContentSourceBlocker(report, reportPath) {
  if (!report) {
    return {
      id: 'content-source-follow-up',
      priority: 'P1',
      message: `未找到内容源跟进报告：${reportPath || '(未指定)'}`,
      nextActions: [{
        id: 'build-content-source-follow-up',
        instruction: '先生成内容源跟进报告，再处理报告中的首个批次。',
      }],
    };
  }
  if (report.status === 'ready') return null;
  const summary = report.summary || {};
  const nextBatchId = summary.nextBatchId || '(暂无)';
  return {
    id: 'content-source-follow-up',
    priority: 'P1',
    message: `内容源跟进未 ready：${report.status || 'unknown'}；下一批次 ${nextBatchId}`,
    nextActions: summary.nextBatchId ? [{
      id: 'process-content-source-batch',
      instruction: `处理内容源批次 ${summary.nextBatchId}，补齐外部来源凭证并重新生成报告。`,
    }] : [],
  };
}

function buildRoadmapStatus({
  releaseToolState = null,
  releaseToolStatePath = null,
  contentSourceFollowUp = null,
  contentSourceReportPath = null,
} = {}) {
  const releaseCheck = releaseToolState
    ? validateReleaseToolStateEvidence(releaseToolState)
    : { valid: false, issues: [] };
  const contentSummary = contentSourceFollowUp && contentSourceFollowUp.summary
    ? { ...contentSourceFollowUp.summary }
    : null;
  const release = {
    status: !releaseToolState ? 'missing' : releaseCheck.valid ? 'ready' : 'blocked',
    path: releaseToolStatePath,
    blockerKind: releaseToolState && releaseToolState.blocker ? releaseToolState.blocker.kind : null,
    errorCode: releaseToolState && releaseToolState.checks && releaseToolState.checks.preview
      ? releaseToolState.checks.preview.errorCode || null
      : null,
  };
  const contentSource = {
    status: !contentSourceFollowUp
      ? 'missing'
      : contentSourceFollowUp.status === 'ready' ? 'ready' : 'blocked',
    path: contentSourceReportPath,
    nextBatchId: contentSummary ? contentSummary.nextBatchId || null : null,
    summary: contentSummary,
  };
  const blockers = [
    buildReleaseBlocker(releaseToolState, releaseToolStatePath),
    buildContentSourceBlocker(contentSourceFollowUp, contentSourceReportPath),
  ].filter(Boolean);

  return {
    schemaVersion: STATUS_SCHEMA_VERSION,
    status: blockers.length ? 'blocked' : 'ready',
    release,
    contentSource,
    blockers,
  };
}

function formatRoadmapStatus(report) {
  const lines = [`${report.status === 'ready' ? 'OK' : 'BLOCKED'} roadmap status`];
  lines.push(`发布工具：${report.release.status}${report.release.errorCode ? ` (${report.release.errorCode})` : ''}`);
  lines.push(`内容源：${report.contentSource.status}${report.contentSource.nextBatchId ? `；下一批次 ${report.contentSource.nextBatchId}` : ''}`);
  report.blockers.forEach((blocker) => {
    lines.push(`[${blocker.priority}] ${blocker.message}`);
    blocker.nextActions.forEach((action) => lines.push(`  -> ${action.instruction}`));
  });
  return lines.join('\n');
}

module.exports = {
  STATUS_SCHEMA_VERSION,
  buildRoadmapStatus,
  formatRoadmapStatus,
};
