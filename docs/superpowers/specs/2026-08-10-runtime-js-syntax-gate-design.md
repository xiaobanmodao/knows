# 运行时 JavaScript 语法门禁设计

> 状态：待实现
>
> 日期：2026-08-10

## 背景

现有内容、分包和路由检查会加载大量运行时模块，但不能保证每一个实际会被小程序打包的 JavaScript 文件都被 Node 解析。一次手工扫描已确认当前 136 个运行时 JavaScript 文件均可通过 `node --check`，应将这项事实变成可重复的质量门禁。

## 目标

1. 扫描主包和普通分包的运行时 JavaScript：`app.js`、`pages/`、`components/`、`utils/`、`data/` 与 `packages/`。
2. 使用 Node 自身的语法解析器逐文件执行 `--check`，失败报告必须包含仓库相对路径和解析输出。
3. 不扫描 `scripts/`、`docs/`、`dist/`、`cloudfunctions/`、生成物或测试文件，避免把构建工具、云函数和测试夹具误当成小程序运行时代码。
4. 将检查接入默认 v1.11 质量矩阵，并让两份当前路线文档的实际检查数继续自动同步。
5. 不新增小程序依赖、不修改页面行为、稳定 ID、分包路径、存储、云资源或发布版本。

## 设计

新增 `scripts/check-runtime-js-syntax.js`，导出：

```js
getRuntimeJavaScriptFiles(rootDir) // string[]，按相对路径排序
checkRuntimeJavaScriptSyntax(rootDir) // { status, files, failures }
```

文件枚举固定从运行时根目录递归开始，`app.js` 单独处理；只接受 `.js` 文件并跳过 `*.test.js`。检查器对每一个绝对路径调用当前 Node 可执行文件的 `--check`，不 require 运行时文件，因此不会执行小程序页面逻辑。成功时输出文件数量；失败时按相对路径排序并退出非零。

新增契约测试使用真实 Node 解析器：

- 最小运行时夹具中的合法主包/分包文件返回 `passed`；
- 夹具中有语法错误的分包文件返回 `failed`，且失败项记录相对路径；
- `scripts/`、`dist/` 和 `*.test.js` 中的无效文件不会进入运行时扫描；
- 当前项目运行时文件数大于 0 且整体通过。

矩阵在运行时分包依赖检查之后执行语法门禁。`check-roadmap-document-consistency.test.js` 已从矩阵长度派生两份路线文档中的展示数量，因此将门禁接入矩阵后，更新文档数字是强制步骤。

## 验收

- 新检查器对当前 136 个运行时 JavaScript 文件返回 `passed`；
- 语法错误夹具返回 `failed` 并包含对应相对路径；
- 非运行时目录和测试文件不影响结果；
- 默认质量矩阵增加 1 项，计数与两份路线文档一致；
- 现有 113 项检查继续通过，新增门禁后完整矩阵通过；
- 分支不包含构建产物或外部发布尝试。
