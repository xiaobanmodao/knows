# 知识通小程序

微信原生小程序版初中知识库项目。当前 `v1.5.0-dev.1` 从稳定的 v1.4 分包底座继续补深英语知识内容，默认游客模式，支持：

- 数学 29 章、29 个专题和 36 个题型模板
- 英语 42 个可学习教材单元、42 张独立单元知识图、336 个逐词讲解、84 个单元语法点和 684 个单元例句，七年级上下册 144 个词与 36 个语法点已补深，另有 6 个能力专题
- 物理按人教版八上、八下、九全组织 22 章、84 个章节知识点、84 张独立知识图解、22 个方法模板、252 道示例和 29 个重点实验，另保留 6 个综合专题
- 教材单元、英语单词与语法，以及三科学科内容统一检索
- 示例、实验、公式、步骤和图示等结构化内容
- 按学科收藏与最近浏览
- 七、八、九年级数学快捷切换
- 游客模式本地存储和旧数学记录自动迁移
- 教材目录与专题索引分开切换，知识点支持折叠阅读和上下篇连续浏览
- 搜索支持学科与内容类型筛选、相关度分组和英语单词/语法单元内直达
- 本地继续阅读、阅读位置恢复、知识笔记和自定义标签

## 当前结构

- `app.js` / `app.json` / `app.wxss`：全局入口
- `pages/`：首页、搜索、收藏、我的，以及旧内容路径的轻量兼容跳转页
- `packages/math/`：数学目录、章节、专题、知识点、模板页面与数学数据仓库
- `packages/english/`：英语教材目录、单元、专题、知识点、模板页面与英语数据仓库
- `packages/physics/`：物理教材目录、章节、专题、知识点、模板页面与物理数据仓库
- `components/`：学科卡片、搜索栏、内容块、空状态
- `data/subject-manifest.js`：不含正文的轻量学科清单与首页推荐项
- `data/search-index.js`：由构建脚本生成的主包轻量搜索索引
- `utils/content-routes.js`：根据学科、类型和稳定 ID 生成分包路径
- `utils/subjects.js`：保留轻量学科信息与索引搜索的主包兼容门面
- `utils/storage.js`：游客模式本地存储与版本迁移
- `assets/figures/generated/`：原创图示源文件，运行时使用云存储

## 打开方式

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录选择当前文件夹
4. `AppID` 替换为你自己的小程序 `AppID`
5. 编译后即可预览

## 当前说明

- 当前默认游客模式，不要求登录，也不上传学习记录
- 数学使用“年级 -> 教材章节 -> 知识点”主结构，专题作为辅助索引
- 英语使用“学科 -> 教材册次 -> 单元 -> 逐词讲解/单元语法”主结构，专题作为辅助索引
- 物理使用“学科 -> 教材册次 -> 章节 -> 知识点 -> 方法模板”主结构，专题作为辅助索引
- 教材和自有教辅只用于核对课程边界与层级，正文、题目和插图均为原创整理

## 发布前校验

上传体验版前建议依次执行：

```bash
node scripts/check-release-readiness.js
node scripts/check-english-units.js
node scripts/check-english-accuracy.js
node scripts/check-english-depth.js
node scripts/check-physics-curriculum.js
node scripts/check-physics-accuracy.js
node scripts/check-subject-content.js
node scripts/check-math-content.js
node scripts/check-math-accuracy.js
node scripts/check-unique-figures.js
node scripts/prepare-remote-assets.js
node scripts/check-remote-assets.js
node scripts/check-content-migration.js
node scripts/check-content-review-meta.js
node scripts/check-search-experience.js
node scripts/check-search-index.js
node scripts/check-content-routes.js
node scripts/check-package-boundaries.js
node scripts/check-content-schema.js
node scripts/check-content-diff.js
node scripts/check-package-sizes.js
node scripts/check-cloud-assets-runtime.js
```

## 当前开发顺序

1. 正式云环境与 `getImageTempUrls` 已复核通过，运行时改为云函数签名优先、客户端兜底
2. 在 iPhone 与 Android 实体手机完成三科首次分包加载、搜索、收藏、笔记和弱网降级回归
3. 通过后更新为 `1.4.0-rc.1` 并生成体验版
4. `codex/english-depth-v1.5` 按七上、七下、八上、八下、九上顺序补深英语逐词讲解与单元语法

## 后续开发

- 详细发布清单与长期路线见：`docs/后续开发与发布路线.md`
- v1.2 数据、资源和验收记录见：`docs/v1.2多学科基础版实施记录.md`
- v1.3 阅读体验实施记录见：`docs/v1.3知识阅读体验实施记录.md`
- v1.4 分包底座实施记录见：`docs/v1.4分包底座实施记录.md`
- 人教版英语目录基线与原创规范见：`docs/人教版英语内容来源与编写规范.md`
- 英语词汇、语法和例句逐册复核见：`docs/英语内容准确性复核记录.md`
- 人教版物理目录基线与原创规范见：`docs/人教版物理内容来源与编写规范.md`
- 物理公式、实验和安全边界逐章复核见：`docs/物理内容准确性复核记录.md`
- 数学官方目录口径与原创规范见：`docs/数学目录与模型来源说明.md`
- 数学公式、条件、示例和模板逐章复核见：`docs/数学内容准确性复核记录.md`
