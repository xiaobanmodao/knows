# 知识通小程序

微信原生小程序版知识库项目，当前完成第一版数学 MVP，默认游客模式，支持：

- 数学章节浏览
- 知识点详情
- 答题模板
- 示例题分层展示
- 搜索
- 收藏
- 最近浏览
- 图示资源展示

## 当前结构

- `app.js` / `app.json` / `app.wxss`：全局入口
- `pages/`：首页、数学目录、章节、知识点、搜索、收藏、我的
- `components/`：学科卡片、搜索栏、内容块、空状态
- `data/math-data.js`：数学内容数据
- `utils/math.js`：数学数据查询与搜索
- `utils/storage.js`：游客模式下本地存储
- `assets/figures/`：图示资源

## 打开方式

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录选择当前文件夹
4. `AppID` 替换为你自己的小程序 `AppID`
5. 编译后即可预览

## 当前说明

- 当前默认游客模式，不要求登录
- 数学内容已按清晰层级组织，可继续扩充数据
- 英语和物理入口已预留，后续可复用同一套架构扩展

## 发布前校验

上传体验版前建议依次执行：

```bash
node scripts/check-release-readiness.js
node scripts/check-math-content.js
node scripts/check-unique-figures.js
```

## 下一步建议

1. 在开发者工具里先跑通界面
2. 我继续补齐数学内容密度和页面交互细节
3. 数学稳定后扩展英语与物理

## 后续开发

- 详细发布清单与长期路线见：`docs/后续开发与发布路线.md`
