# 本地备份文件隐私接口审计设计

> 状态：已确认，准备按 TDD 实现
>
> 日期：2026-08-10

## 背景

知识通的本地备份支持两条用户主动操作链路：用户选择已有 JSON 备份文件进行恢复，以及用户主动转发应用生成的本地备份文件。当前源码只在 `utils/local-backup-file.js` 使用 `wx.chooseMessageFile` 和 `wx.shareFileMessage`，但现有隐私接口门禁只覆盖 Clipboard。

## 目标

1. 在现有 `scripts/check-privacy-interfaces.js` 中登记文件接口，不新增重复审计脚本。
2. 保证 `wx.chooseMessageFile` 和 `wx.shareFileMessage` 只出现在本地备份工具文件中，调用次数分别为 1。
3. 明确文件行为是用户主动选择或主动转发，不后台选择文件、不自动上传、不向未选择的目标发送文件。
4. 不改变备份格式、恢复逻辑、文件大小限制、存储版本或运行时页面行为。

## 设计

扩展现有审计报告，保留原有 `clipboard` 字段并新增 `file` 字段：

```js
{
  status: 'passed',
  clipboard: { readCalls: 0, writeCalls: 8, writesByFile: {}, allowedFiles: [] },
  file: {
    calls: 2,
    callsByApi: {
      'wx.chooseMessageFile': 1,
      'wx.shareFileMessage': 1
    },
    callsByFile: { 'utils/local-backup-file.js': 2 },
    allowedFiles: ['utils/local-backup-file.js']
  },
  errors: []
}
```

文件接口策略固定为：

| 接口 | 次数 | 用途 |
|---|---:|---|
| `wx.chooseMessageFile` | 1 | 用户主动选择知识通 JSON 备份文件，在本机校验并恢复 |
| `wx.shareFileMessage` | 1 | 用户主动导出并选择转发应用生成的本地备份文件 |

审计器扫描运行时 JavaScript 时，若发现文件接口出现在未登记文件、调用次数改变或出现未登记的文件接口，返回确定性错误码。Clipboard 的既有规则和输出保持不变。

## 隐私说明口径

文件备份相关说明使用以下准确表述：

> 用于在用户主动选择知识通备份文件后，在本机读取并校验该文件以恢复收藏、笔记和阅读记录；以及在用户主动选择导出备份并确认转发后，通过微信文件转发功能发送用户选择的本地备份文件。应用不会在后台选择或读取文件，不会自动上传文件，也不会向用户未选择的对象发送文件。

备份文件可能包含用户主动记录的笔记正文。应用只在用户发起恢复或导出操作时处理该文件，失败时保留本地文字内容和原有数据。

## 测试与验收

- 真实路线工作树和冻结发布工作树的 `wx.chooseMessageFile`、`wx.shareFileMessage` 均为各 1 次；
- 两个接口均只出现在 `utils/local-backup-file.js`；
- 测试覆盖未登记文件、次数变化和未登记文件接口；
- Clipboard 原有 8 次写入、0 次读取检查保持通过；
- v1.11 质量矩阵默认检查数量保持 92，只扩展现有隐私审计的覆盖范围；
- 不把静态审计结果当作微信平台隐私审核结果。
