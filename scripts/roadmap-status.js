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

function buildContentSourceBlocker(report, reportPath, reportFresh) {
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
  if (reportFresh === false) {
    return {
      id: 'content-source-follow-up',
      priority: 'P1',
      message: `内容源跟进报告已过期：${reportPath || '(未指定)'}；请根据 manifest 重新生成`,
      nextActions: [{
        id: 'rebuild-content-source-follow-up',
        instruction: '重新运行 build-content-source-follow-up.js，再执行状态检查。',
      }],
    };
  }
  if (report.status === 'ready') return null;
  const summary = report.summary || {};
  const nextBatchId = summary.nextBatchId || '(暂无)';
  const nextBatch = Array.isArray(report.batches)
    ? report.batches.find((batch) => batch && batch.id === summary.nextBatchId)
    : null;
  const evidenceNote = nextBatch && nextBatch.sourceRequirements && nextBatch.sourceRequirements.note
    ? `：${nextBatch.sourceRequirements.note}`
    : '';
  return {
    id: 'content-source-follow-up',
    priority: 'P1',
    message: `内容源跟进未 ready：${report.status || 'unknown'}；下一批次 ${nextBatchId}`,
    nextActions: summary.nextBatchId ? [{
      id: 'process-content-source-batch',
      instruction: `处理内容源批次 ${summary.nextBatchId}${evidenceNote}；补齐外部来源凭证并重新生成报告。`,
    }] : [],
  };
}

function buildContentSourceUrlAccessBlocker(report, reportPath, reportFresh) {
  if (!report) return null;
  if (reportFresh === false) {
    return {
      id: 'content-source-url-access',
      priority: 'P1',
      message: `内容源 URL 可访问性报告已过期：${reportPath || '(未指定)'}；请根据当前 manifest 重新生成`,
      nextActions: [{
        id: 'rebuild-content-source-url-access',
        instruction: '重新运行 check-content-source-url-access.js，并使用当前外部 manifest 生成报告。',
      }],
    };
  }
  if (report.status === 'passed' || report.status === 'no-sources') return null;
  const summary = report.summary || {};
  if (report.status === 'blocked' || Number(summary.failed) > 0) {
    return {
      id: 'content-source-url-access',
      priority: 'P1',
      message: `内容源 URL 可访问性未通过：${summary.failed || 0} 个来源链接失败`,
      nextActions: [{
        id: 'check-content-source-url-access',
        instruction: '重新检查来源 URL 的可访问性，确认官方页面可打开后再继续资料接入。',
      }],
    };
  }
  return {
    id: 'content-source-url-access',
    priority: 'P1',
    message: `内容源 URL 可访问性报告状态无效：${report.status || 'unknown'}`,
    nextActions: [{
      id: 'rebuild-content-source-url-access',
      instruction: '重新运行 check-content-source-url-access.js 生成有效报告。',
    }],
  };
}

function buildContentSourceReadiness(report) {
  if (!report || !Array.isArray(report.batches) || !report.batches.length) return null;
  const current = { total: report.batches.length, ready: 0, pending: 0, failed: 0 };
  const external = { total: report.batches.length, ready: 0, pending: 0, failed: 0, missing: 0 };

  report.batches.forEach((batch) => {
    const reviewPending = batch.review && Number(batch.review.untracked) > 0;
    const failed = batch.status === 'failed';
    const pending = !failed && (batch.status !== 'passed' || reviewPending);
    if (failed) current.failed += 1;
    else if (pending) current.pending += 1;
    else current.ready += 1;

    if (batch.sourceKind !== 'external-source') {
      external.missing += 1;
    } else if (failed) {
      external.failed += 1;
    } else if (pending) {
      external.pending += 1;
    } else {
      external.ready += 1;
    }
  });

  return {
    current: {
      ...current,
      status: current.failed ? 'blocked' : current.pending ? 'needs-review' : 'ready',
    },
    external: {
      ...external,
      status: external.missing || external.failed ? 'blocked' : external.pending ? 'needs-review' : 'ready',
    },
  };
}

function buildRoadmapStatus({
  releaseToolState = null,
  releaseToolStatePath = null,
  contentSourceFollowUp = null,
  contentSourceReportPath = null,
  contentSourceReportFresh = true,
  contentSourceUrlAccess = null,
  contentSourceUrlAccessPath = null,
  contentSourceUrlAccessReportFresh = true,
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
    reportFresh: contentSourceReportFresh !== false,
    nextBatchId: contentSummary ? contentSummary.nextBatchId || null : null,
    summary: contentSummary,
    readiness: buildContentSourceReadiness(contentSourceFollowUp),
  };
  const contentSourceUrlAccessSummary = contentSourceUrlAccess && contentSourceUrlAccess.summary
    ? { ...contentSourceUrlAccess.summary }
    : null;
  const contentSourceUrlAccessState = {
    status: !contentSourceUrlAccess
      ? 'not-run'
      : contentSourceUrlAccess.status === 'passed'
        ? 'ready'
        : contentSourceUrlAccess.status === 'no-sources'
          ? 'not-applicable'
          : 'blocked',
    path: contentSourceUrlAccessPath,
    reportFresh: contentSourceUrlAccessReportFresh !== false,
    summary: contentSourceUrlAccessSummary,
  };
  const blockers = [
    buildReleaseBlocker(releaseToolState, releaseToolStatePath),
    buildContentSourceBlocker(contentSourceFollowUp, contentSourceReportPath, contentSourceReportFresh),
    buildContentSourceUrlAccessBlocker(contentSourceUrlAccess, contentSourceUrlAccessPath, contentSourceUrlAccessReportFresh),
  ].filter(Boolean);

  return {
    schemaVersion: STATUS_SCHEMA_VERSION,
    status: blockers.length ? 'blocked' : 'ready',
    release,
    contentSource,
    contentSourceUrlAccess: contentSourceUrlAccessState,
    blockers,
  };
}

function formatRoadmapStatus(report) {
  const lines = [`${report.status === 'ready' ? 'OK' : 'BLOCKED'} roadmap status`];
  lines.push(`发布工具：${report.release.status}${report.release.errorCode ? ` (${report.release.errorCode})` : ''}`);
  lines.push(`内容源：${report.contentSource.status}${report.contentSource.nextBatchId ? `；下一批次 ${report.contentSource.nextBatchId}` : ''}`);
  if (report.contentSource.readiness) {
    lines.push(`内容源当前源：${report.contentSource.readiness.current.status}；外部资料：${report.contentSource.readiness.external.status}`);
  }
  const urlAccessSummary = report.contentSourceUrlAccess.summary;
  const urlFailureSuffix = urlAccessSummary && urlAccessSummary.failed
    ? `；失败 ${urlAccessSummary.failed}`
    : '';
  lines.push(`内容源 URL：${report.contentSourceUrlAccess.status}${urlFailureSuffix}`);
  report.blockers.forEach((blocker) => {
    lines.push(`[${blocker.priority}] ${blocker.message}`);
    blocker.nextActions.forEach((action) => lines.push(`  -> ${action.instruction}`));
  });
  return lines.join('\n');
}

module.exports = {
  STATUS_SCHEMA_VERSION,
  buildRoadmapStatus,
  buildContentSourceReadiness,
  formatRoadmapStatus,
};
