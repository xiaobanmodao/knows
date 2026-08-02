# v1.7 Catalog 普通分包与主包减重设计

## 1. 背景与目标

微信开发者工具对 `codex/chemistry-foundation-v1.7` 的真实预览包体报告显示：

| 包 | 当前大小 |
|---|---:|
| 主包 | 885.0 KiB |
| 英语分包 | 521.2 KiB |
| 数学分包 | 525.6 KiB |
| 物理分包 | 244.9 KiB |
| 化学分包 | 187.1 KiB |

同一版本开发者工具生成的 v1.6 基线主包为 826.2 KiB，说明旧的 495.5 KiB 报告已经失效。v1.7 新增化学约增加 60 KiB，但主包超出 700 KiB 目标的主要原因是以下两个全文索引仍位于主包：

- `data/search-index.js`：约 599 KiB；
- `data/reference-index.js`：约 150 KiB。

本设计新增普通分包 `packages/catalog/`，把全局搜索和知识参考索引的页面、全文索引及查询逻辑迁入该分包。主包继续保存首页、收藏、我的、公共组件、路由和少量展示元数据。

完成后必须同时达到：

1. 主包严格小于 700 KiB；
2. `catalog` 分包严格小于 1 MiB；
3. 数学、英语、物理、化学分包继续严格小于 1 MiB；
4. 搜索结果、参考索引、旧链接和本地记录目标不发生行为回归；
5. 学生可见界面不再出现过期的“三科”描述。

## 2. 范围与非目标

### 2.1 本次范围

- 新增 `catalog` 普通分包；
- 迁移全局搜索页、参考索引页、两个完整生成索引及其查询逻辑；
- 建立非学科分包也能复用的轻量包注册表；
- 保留 `/pages/search/index` 和 `/pages/reference-index/index` 旧路径兼容；
- 将所有应用内新入口改为直接打开 `catalog` 分包；
- 修复首页、搜索页和“我的”页共 5 处过期学科文案；
- 更新索引生成、分包边界、包体、路由和体验校验。

### 2.2 非目标

- 不修改 895 条搜索实体的排序、字段语义或稳定键；
- 不修改 658 条参考索引实体的稳定键或目标内容 ID；
- 不压缩、删减或截断搜索关键词来换取包体；
- 不改变收藏、最近浏览、笔记、标签、阅读位置或本地备份 schema；
- 不增加自动预下载、独立分包、云端搜索、登录或同步；
- 不在本次补充新的学科知识正文。

## 3. 包结构

### 3.1 新增普通分包

`app.json` 新增以下配置，不设置 `preloadRule`：

```json
{
  "root": "packages/catalog",
  "name": "catalog",
  "pages": [
    "pages/search/index",
    "pages/reference-index/index"
  ]
}
```

目录固定为：

```text
packages/catalog/
  data/
    search-index.js
    reference-index.js
  pages/
    search/
      index.js
      index.json
      index.wxml
      index.wxss
    reference-index/
      index.js
      index.json
      index.wxml
      index.wxss
  utils/
    search-index.js
    reference-index.js
```

`catalog` 是工具分包，不是学科，不进入首页学科卡片、学科筛选数量、内容统计或 `subjectId` 枚举。

普通分包允许依赖主包公共代码，因此两个页面继续使用主包的：

- `components/search-bar`、`components/highlight-text`、`components/empty-state`；
- `data/subject-manifest.js` 和 `data/search-aliases.js`；
- `utils/content-routes.js`、`utils/search-text.js`；
- `app.js` 中的本地搜索历史能力。

`catalog` 不得引用任何学科分包；各学科分包也不得引用 `catalog` 的数据或查询模块。

### 3.2 主包保留内容

主包继续保留：

- 首页、收藏、“我的”和全部旧路径兼容页；
- 公共组件、全局样式、学科清单和统一内容路由；
- 搜索别名；
- 参考索引的轻量类型元数据；
- 本地存储、备份、笔记和阅读设置。

完整的 `data/search-index.js`、`data/reference-index.js`、`utils/search-index.js` 和 `utils/reference-index.js` 必须从主包路径删除。仅停止 `require()` 不足以减小微信上传包，因为未引用文件仍可能被打入包内。

## 4. 轻量包注册与路由

### 4.1 包注册表

新增 `data/package-manifest.js`，将工具分包与学科分包统一为构建期可查询的包清单。公开接口固定为：

```js
getPackageRegistry(options?)
getPackageMeta(packageId, options?)
```

`options` 只支持 `includeBuilding`，默认 `false`。默认注册表包含 `catalog` 和全部 active 学科包；`includeBuilding: true` 仅供构建检查预审尚未开放的学科包。`getPackageMeta()` 对未知 ID 返回 `null`，不得回退到数学包。

每项结构为：

```js
{
  id,
  name,
  root,
  kind: "tool" | "subject",
  pages,
  routes,
  sizeLimitBytes
}
```

`catalog` 在该文件中显式声明；学科包由 `getSubjectRegistry()` 的 `packageRoot`、`packagePages` 和路由元数据生成。该注册表只依赖轻量学科清单，不加载任何学科正文。

以下构建检查改为遍历包注册表，而不是假定“一个分包等于一个学科”：

- `scripts/check-package-boundaries.js`；
- `scripts/check-package-sizes.js`；
- `scripts/check-release-readiness.js` 中的分包配置核对。

### 4.2 Catalog 路由器

新增 `utils/catalog-routes.js`，公开接口固定为：

```js
buildCatalogRoute(routeId, query?)
openCatalogRoute(routeId, query?, options?)
```

支持两个 `routeId`：

- `search` -> `/packages/catalog/pages/search/index`；
- `referenceIndex` -> `/packages/catalog/pages/reference-index/index`。

`buildCatalogRoute()` 遇到未知 `routeId` 时抛出明确错误，避免错误入口被静默导向其他页面。`openCatalogRoute()` 返回最终 URL，便于兼容页和路由测试核对。

`utils/content-routes.js` 抽出并导出通用的 `appendQuery()` 与 `openRoute()`；现有 `openContent()` 继续使用相同行为，并改为调用 `openRoute()`。`catalog-routes.js` 复用这两个能力，不复制加载提示、失败弹窗和重试逻辑。

直接入口使用 `navigateTo`。加载或导航失败时必须：

1. 关闭加载提示；
2. 保留当前页面；
3. 显示可重试操作；
4. 第二次失败后仍不得出现空白页或死循环。

## 5. 旧路径兼容

以下主包路径继续保留在 `app.json.pages`：

- `/pages/search/index`；
- `/pages/reference-index/index`。

两页替换为轻量兼容跳转页，复用 `utils/legacy-route-page.js` 的加载、失败和重试界面。`createLegacyRoutePage()` 增加 `resolveUrl` 入口，同时保留现有 `resolveItem` 行为，避免影响数学、英语、物理和化学的其他旧链接。

兼容规则固定为：

- 搜索页只透传当前已支持的 `q` 和 `subjectId`；
- 参考索引页只透传当前已支持的 `kind`；
- 跳转使用 `redirectTo`，不在返回栈中留下中间兼容页；
- 参数为空或无效时由目标页沿用当前默认值；
- 跳转失败时保留兼容页并显示“重试”，不自动无限重试。

首页、数学、英语、物理、化学和“我的”中的新入口全部改用 `openCatalogRoute()`，不得继续生成旧主包路径。旧路径只服务历史分享链接、收藏的旧页面地址和手工打开场景。

## 6. 索引生成与运行时数据流

### 6.1 搜索索引

构建流程仍从四科学科适配器读取完整内容，索引结构、评分规则和源哈希算法保持不变。生成位置改为：

```text
packages/catalog/data/search-index.js
```

运行时查询模块改为：

```text
packages/catalog/utils/search-index.js
```

它继续公开：

```js
SEARCH_INDEX_META
TYPE_LABELS
expandSearchTerms()
normalizeSearchText()
getSearchIndexEntries()
searchAllSubjects()
```

所有校验脚本和语义探针改为引用新位置。迁移前后的 `sourceHash`、`entryCount`、稳定 `key` 集合及代表性查询结果必须完全一致。

### 6.2 参考索引

完整参考索引生成位置改为：

```text
packages/catalog/data/reference-index.js
```

运行时查询模块改为：

```text
packages/catalog/utils/reference-index.js
```

参考索引依赖同分包的搜索查询模块生成英语单词和语法条目，不跨分包读取英语正文。

构建脚本同时在主包生成轻量文件：

```text
data/reference-index-meta.js
```

该文件只导出：

```js
REFERENCE_INDEX_META
REFERENCE_KIND_META
```

“我的”页只读取该元数据展示公式、单词、语法、实验和方程式的数量；完整行数据只在进入 `catalog` 分包后加载。完整索引和轻量元数据必须由同一次构建生成并拥有相同 `sourceHash`。

### 6.3 数据流

```text
四科学科静态内容
  -> scripts/subject-adapters
  -> search/reference builders
  -> packages/catalog/data/* 完整索引
  -> catalog 页面本地查询
  -> utils/content-routes 打开对应学科分包

reference builder
  -> data/reference-index-meta.js 轻量计数
  -> 主包“我的”页
```

搜索历史仍由 `app.js` 维护，本地键和值不变。收藏、最近浏览、笔记和阅读位置继续保存 `subjectId:type:id` 等稳定信息，不保存 `catalog` 页面路径，因此无需存储迁移。

## 7. 动态学科文案

当前界面存在 5 处过期的“三科”或三科枚举。修复时不改成另一个硬编码“四科”，而是从 `getSubjectRegistry()` 生成：

```js
subjectCount
subjectNames
subjectNamesText
```

- `subjectCount`：active 学科数量；
- `subjectNames`：用于短标签的 `数学 · 英语 · 物理 · 化学`；
- `subjectNamesText`：用于句子的 `数学、英语、物理、化学`。

具体调整：

1. 首页简介改为面向初中阶段的“多学科知识库”描述；
2. 首页统计标签使用 `{{subjectCount}} 科内容条目`；
3. 首页学科入口副标题使用 `{{subjectNames}}`；
4. “我的”页简介使用 `{{subjectNamesText}}`；
5. 搜索页说明改为“各学科知识和方法”，不再写固定科目数量。

新增学生界面文案检查，禁止学生可见页面继续出现“三科”“数学、英语和物理”“数学 · 英语 · 物理”等旧字符串。

## 8. 校验与测试

### 8.1 构建期校验

必须更新并通过：

- `check-package-boundaries.js`：主包不得引用任一分包；任一分包不得交叉引用其他分包；`catalog` 与四科学科配置均和包注册表一致；
- `check-package-sizes.js`：检查 `main`、`catalog` 和全部 active 学科分包；
- `check-search-index.js`：新生成路径、哈希、895 条实体、唯一键、运行时查询和目标页注册均有效；
- `check-reference-index.js`：新生成路径、658 条实体、轻量元数据一致、目标引用和页面注册有效；
- `check-content-routes.js`：应用内入口直接进入新分包，旧路径仍能映射；
- `check-search-experience.js`：既有 49 组代表性查询结果不回归；
- `check-release-readiness.js`：普通分包配置完整、没有预下载、版本和服务范围有效；
- 学生界面文案检查：5 处旧描述清零。

新增边界断言：

- 主包目录中不存在完整搜索行和参考索引行；
- 主包 JS 不引用 `packages/catalog`；
- `packages/catalog` 不引用 `packages/math`、`packages/english`、`packages/physics` 或 `packages/chemistry`；
- 学科分包不引用 `packages/catalog`；
- `data/reference-index-meta.js` 不包含 `REFERENCE_INDEX_ROWS`。

### 8.2 路由兼容用例

至少覆盖：

1. `/pages/search/index?q=欧姆定律&subjectId=physics` 重定向后自动搜索并命中物理；
2. `/pages/search/index?q=化学方程式&subjectId=chemistry` 重定向后命中化学；
3. `/pages/reference-index/index?kind=equation` 重定向后打开方程式索引；
4. 方程式索引点击后进入化学知识点并定位指定 `focusId`；
5. 单词和语法索引点击后进入英语单元并展开目标卡片；
6. 直接从首页或“我的”进入时，返回一次即回到来源页；
7. 模拟导航失败时显示重试，且当前页面未丢失。

### 8.3 微信开发者工具回归

使用同一次正式预览报告执行精确包体门禁，并在 iPhone 14 Pro Max 与 Nexus 5 模拟器分别验证：

- 冷启动后首次进入搜索，确认按需加载 `catalog`；
- 第二次进入搜索，确认历史记录和返回栈正常；
- 搜索“手拉手模型、被动语态、受力分析、欧姆定律、燃烧条件、化学方程式”；
- 打开公式、单词、语法、实验和方程式五类参考索引；
- 从搜索和参考索引分别进入四科学科分包；
- 云图片失败时文字内容仍完整；
- 页面无重叠、无空白、无项目控制台错误。

## 9. 实施顺序

1. 新增包注册表、通用 `openRoute()` 和 `catalog` 路由器，并先补路由单元校验；
2. 新增 `catalog` 分包配置和页面，实现新入口直达；
3. 迁移两个完整索引与查询模块，调整构建脚本并生成轻量参考元数据；
4. 将主包旧页面替换为兼容跳转页，删除主包中的完整索引和查询文件；
5. 修复 5 处学生界面文案并增加回归检查；
6. 运行全部本地校验，确认索引哈希、数量和查询结果一致；
7. 用微信开发者工具重新生成预览报告并执行精确包体门禁；
8. 完成 iPhone 14 Pro Max 与 Nexus 5 模拟器回归；
9. 更新 v1.7 实施记录，按“路由底座、索引迁移、验收文档”分批提交并推送。

## 10. 验收定义

满足以下全部条件才可认为本设计实施完成：

- 主包 `< 700 KiB`；
- `catalog`、数学、英语、物理、化学各自 `< 1 MiB`；
- 正式预览总包符合微信平台限制；
- 895 条搜索实体和 658 条参考实体数量不变，源哈希与构建结果一致；
- 旧搜索与参考索引路径可用，新入口不再经过兼容页；
- 四科学科搜索、参考索引直达、收藏和最近浏览目标均可打开；
- 5 处旧学科文案清零且后续扩科无需再次硬编码数量；
- 全部本地校验通过，双机型模拟器控制台无项目错误；
- 不改变本地存储版本，不上传任何用户数据。
