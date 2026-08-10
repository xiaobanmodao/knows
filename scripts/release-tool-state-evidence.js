function validateReleaseToolStateEvidence(report) {
  const issues = [];
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    return { valid: false, issues: ['状态报告根对象无效'] };
  }
  if (report.schemaVersion !== 1) issues.push('状态报告 schemaVersion 必须为 1');
  if (report.status !== 'ready') {
    const blocker = report.blocker && report.blocker.kind ? ` (${report.blocker.kind})` : '';
    issues.push(`开发者工具状态必须为 ready，当前为 ${report.status || '(empty)'}${blocker}`);
  }
  const checks = report.checks || {};
  if (!checks.projectConfig || checks.projectConfig.status !== 'passed') {
    issues.push('开发者工具状态中的项目配置未通过');
  }
  if (!checks.cliLogin || checks.cliLogin.loggedIn !== true) {
    issues.push('开发者工具状态中的登录检查未通过');
  }
  const previewObserved = checks.preview && (
    checks.preview.status === 'observed'
    || (
      ['blocked', 'failed'].includes(checks.preview.status)
      && checks.preview.stage === 'upload'
      && checks.preview.uploadStarted === true
    )
  );
  if (!previewObserved) {
    issues.push('开发者工具状态中的预览日志没有有效上传观察结果');
  }
  if (checks.preview && checks.preview.errorCode) {
    issues.push(`开发者工具上传日志仍含错误码 ${checks.preview.errorCode}`);
  }
  if (checks.preview && checks.preview.appidMatches === false) {
    issues.push('开发者工具日志中的 Using AppID 与项目 AppID 不一致');
  }
  return { valid: issues.length === 0, issues };
}

module.exports = {
  validateReleaseToolStateEvidence,
};
