# 知识通小程序

微信原生小程序版初中知识库项目。当前 `v1.10.1-dev.1` 已包含数学、英语、物理、化学和生物学查阅包，默认游客模式，支持：

- 数学 29 章、29 个专题、89 个详细教材小节、89 条独立推导与 36 个题型模板
- 英语 42 个可学习教材单元、42 张独立单元知识图、336 个详细词条、84 个详细单元语法点和 924 个单元例句，已核对的五册内容全部补深，另有 6 个能力专题
- 物理按人教版八上、八下、九全组织 22 章、84 个详细知识点、225 组物理量引用、32 组方向规则、84 张独立知识图解、22 个方法模板、252 道示例和 29 个结构化重点实验，另保留 6 个综合专题
- 教材单元、英语单词与语法，以及五科学科内容统一检索
- 示例、实验、公式、步骤和图示等结构化内容
- 按学科收藏与最近浏览
- 七、八、九年级数学快捷切换
- 游客模式本地存储和旧数学记录自动迁移
- 教材目录与专题索引分开切换，知识点支持折叠阅读和上下篇连续浏览
- 搜索支持学科与内容类型筛选、相关度分组和英语单词/语法单元内直达
- 本地继续阅读、阅读位置恢复、知识笔记和自定义标签
- 173 条数学/物理公式、336 个英语单词、84 个语法点和 29 个物理实验统一索引
- 生物学 6 个单元、36 个知识点、6 个方法模板、108 个原创例子和 6 个观察说明

## 当前结构

- `app.js` / `app.json` / `app.wxss`：全局入口
- `pages/`：首页、搜索、收藏、我的，以及旧内容路径的轻量兼容跳转页
- `packages/catalog/`：按需加载的全局搜索与知识索引工具分包
- `packages/math/`：数学目录、章节、专题、知识点、模板页面与数学数据仓库
- `packages/english/`：英语教材目录、单元、专题、知识点、模板页面与英语数据仓库
- `packages/physics/`：物理教材目录、章节、专题、知识点、模板页面与物理数据仓库
- `packages/chemistry/`：化学主题、专题、知识点、实验和方法页面与化学数据仓库
- `packages/biology/`：生物学六单元、知识点、观察说明和方法模板页面与生物学数据仓库
- `components/`：学科卡片、搜索栏、内容块、空状态
- `data/subject-manifest.js`：不含正文的轻量学科清单与首页推荐项
- `data/reference-index-meta.js`：主包内仅含参考类型、数量和源哈希的生成元数据
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
node scripts/check-package-manifest.js
node scripts/check-student-copy.js
node scripts/check-english-units.js
node scripts/check-english-accuracy.js
node scripts/check-english-depth.js
node scripts/check-physics-curriculum.js
node scripts/check-physics-accuracy.js
node scripts/check-physics-depth.js
node scripts/check-subject-content.js
node scripts/check-math-content.js
node scripts/check-math-accuracy.js
node scripts/check-math-depth.js
node scripts/check-unique-figures.js
node scripts/prepare-remote-assets.js
node scripts/check-remote-assets.js
node scripts/check-content-migration.js
node scripts/check-note-filters.js
node scripts/check-local-backup.js
node scripts/check-reading-display.js
node scripts/check-content-review-meta.js
node scripts/check-search-experience.js
node scripts/check-search-index.js
node scripts/check-search-semantics.js
node scripts/check-reference-index.js
node scripts/check-content-routes.js
node scripts/check-package-boundaries.js
node scripts/check-content-schema.js
node scripts/check-content-diff.js
node scripts/check-package-sizes.js
node scripts/check-cloud-assets-runtime.js
node scripts/build-content-audit.js
node scripts/check-content-audit.js
node scripts/build-content-review-queue.js
node scripts/check-content-review-queue.js
node scripts/check-math-container-review.js
node scripts/build-math-curriculum-audit.js
node scripts/check-math-curriculum-audit.js
node scripts/math-volume-map.test.js
node scripts/english-curriculum-map.test.js
node scripts/check-v1.11-quality-matrix.js
```

生物学 v1.8 的实体设备回归步骤和发布门禁见：`docs/v1.8实体设备回归清单.md`。模拟器通过不等于真机通过；实体 iPhone 与 Android 回归完成前不创建 RC。

复核队列只暴露尚未登记复核的内容，不会自动把内容标记为已复核；`--require-reviewed` 在来源和人工复核记录补齐后再作为严格门禁。

数学新版目录差异报告只记录稳定容器、公开确认的结构变化和待核对项，不自动重排章节，也不替代生物学 v1.8 的实体设备发布门禁。

数学、英语和物理容器复核按批次登记。当前 29 个数学章节、29 个数学专题、36 个数学方法模板、6 个英语专题、6 个物理专题、6 个英语方法模板和 28 个物理方法模板已完成容器级复核；当前复核队列为空。

## 当前开发顺序

1. 在微信开发者工具确认 AppID 权限和项目绑定，解决 `41002 appid missing`
2. 在当前最终构建上生成二维码、日志和 `packages-preview.json`，不使用历史包体报告
3. 在 iPhone 与 Android 实体设备完成 `docs/v1.10发布前实体设备回归清单.md` 的 A1-A15
4. 通过严格发布门禁后创建 `1.10.1-rc.1` 并生成体验版，不直接提交正式审核
5. 在 `codex/roadmap-v1.11` 建立数学新版逐册目录官方证据映射和差异报告
6. 核对英语九年级下册正式目录和可靠教材文件，资料不足时保持空缺，不猜测扩充
7. 按数学、英语、物理、化学、生物顺序做高风险字段小批复核，持续运行内容审计和资源检查
8. 继续保持纯知识查阅，不加入答题、测评、任务、错题、登录或云同步

## 后续开发

- 详细发布清单与长期路线见：`docs/后续开发与发布路线.md`
- v1.11 具体阶段、分支边界与验收命令见：`docs/v1.11后续开发路线.md`
- 数学新版目录证据表实施记录见：`docs/v1.11数学新版目录证据表实施记录.md`
- 英语九年级下册目录核对记录见：`docs/v1.11英语九年级下册目录核对实施记录.md`
- v1.2 数据、资源和验收记录见：`docs/v1.2多学科基础版实施记录.md`
- v1.3 阅读体验实施记录见：`docs/v1.3知识阅读体验实施记录.md`
- v1.4 分包底座实施记录见：`docs/v1.4分包底座实施记录.md`
- 人教版英语目录基线与原创规范见：`docs/人教版英语内容来源与编写规范.md`
- 英语词汇、语法和例句逐册复核见：`docs/英语内容准确性复核记录.md`
- 人教版物理目录基线与原创规范见：`docs/人教版物理内容来源与编写规范.md`
- 物理公式、实验和安全边界逐章复核见：`docs/物理内容准确性复核记录.md`
- 数学官方目录口径与原创规范见：`docs/数学目录与模型来源说明.md`
- 数学公式、条件、示例和模板逐章复核见：`docs/数学内容准确性复核记录.md`
- 数学方法模板复核与当前队列见：`docs/v1.9.6数学方法模板复核实施记录.md`
- 英语专题复核与当前队列见：`docs/v1.9.7英语专题容器复核实施记录.md`
- 物理专题复核与当前队列见：`docs/v1.9.8物理专题容器复核实施记录.md`
- 英语方法模板复核与当前队列见：`docs/v1.9.9英语方法模板复核实施记录.md`
- 物理方法模板复核与当前队列见：`docs/v1.10.0物理方法模板复核实施记录.md`
