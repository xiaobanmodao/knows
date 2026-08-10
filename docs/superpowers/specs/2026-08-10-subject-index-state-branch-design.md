# 学科首页状态分支修复设计

**目标：** 保证每个学科首页的加载、内容失败和兜底状态形成唯一且可验证的 WXML 条件链。

## 现状问题

化学和生物首页在 `wx:else` 之后重复声明了 `wx:elif="{{notFound}}"`。重复分支不会增加可用状态，反而使模板结构不一致，后续页面维护容易继续复制错误。

## 方案

每个学科首页保留且只保留三种错误态入口：

1. `wx:elif="{{loading}}"`：显示正在打开。
2. `wx:elif="{{notFound}}"`：显示内容失败和重新打开。
3. `wx:else`：显示无上下文时的通用兜底和重新打开。

本次只删除化学、生物首页的重复 WXML 片段，不修改数据、路由、稳定 ID、内容来源或运行时资源处理。

## 校验

扩展 `check-subject-index-fallbacks.test.js`，对五个学科首页统计错误态根节点，要求总数为 3，并分别要求加载、失败和兜底分支恰好出现一次。该契约进入 `check-v1.11-quality-matrix.js` 的默认检查。

## 验收边界

`node scripts/check-subject-index-fallbacks.test.js` 和 `node scripts/check-v1.11-quality-matrix.js` 必须通过。数学新版逐册目录和开发者工具实体/上传证据仍由各自门禁独立管理，不因本次模板修复而改变状态。
