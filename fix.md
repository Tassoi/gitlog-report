• 改造思路（App 布局）

- 采用“双栏 + Hero”或“顶部 Hero + 下方 2 区块”的结构：Hero 展示标题/副文案/CTA/插画，主体区将 ReportViewer 放在主列（~65–70% 宽），CommitList 放在侧栏或切换到标签页，避免同屏拥挤。
- 给容器加 max-width: 1200–1280px，左右留白 24–32px，区块间距 24px+，卡片内边距 16–20px。
- 若仍想单列：使用 Tabs 切换 “报告 / 提交”，顶部保留过滤工具栏（时间/作者/分支），让内容纵向更轻松。

配色与层次

- 深色方案：背景 #0B1021，卡片 #111834，边框 #1B2342，主色 #7CE7A2，次色 #7DA7F9，文字主/次 #EAF2FF / #9FB0D7。
- 浅色方案：背景 #F5F7FB，卡片 #FFFFFF，边框 #E5E9F2，主色 #4C7CF5，次色 #7AC29A，文字主/次 #1E2433 / #5C6475。
- Hero 可用柔和渐变（如 linear-gradient(120deg, 主色 0%, 次色 70%)），内容卡片保持纯色，强调层级。

字体与图标

- 标题字体：Space Grotesk / Sora / DM Sans，正文可用 Inter/Noto Sans。字号层级：H1 28–32px，H2 20–22px，正文 14–16px。
- Lucide 图标：BarChart3（报告），GitCommit/GitBranch（提交/分支），History（时间），Filter（过滤），放在卡片标题左侧或按钮中。

组件布局示例（结构示意）

- Header/Hero: 标题、副标题、两个按钮（主 CTA + 次 CTA）、右侧插画/图形背景。
- Toolbar: 日期范围、作者、分支下拉 + 次要操作菜单（放入 MoreVertical）。
- Main: 左（ReportViewer 卡片+分段标题）；右（CommitList 卡片，滚动区域，行距 12–16px）。或用 Tabs 分离两块。

插画/AI 提示词

- 深色："futuristic dashboard with code commits flowing into a report, neon green accent on deep navy background, clean geometric shapes, no characters"
- 浅色："flat 3D illustration of developers reviewing commit reports on a light dashboard, blue accent, minimal isometric elements"
- 抽象："abstract geometric shapes forming a code branch and report chart, soft gradient background, modern tech style"

微交互

- 卡片悬停轻微提升 + 低阴影；按钮主色渐变或描边次要款；状态用胶囊 Chip。
- 列表行加行高与分隔线弱化，减少拥挤感。

如果你确定偏好深色/浅色，我可以按 App.tsx 的现有结构给出更具体的组件布局和 CSS 变量示例。

---

基于当前 App.tsx 的具体改造示例（shadcn 组件）

- 目标：减轻左右并排的拥挤感，强化 Hero + 过滤区的视觉层次，保持 shadcn 风格一致。
- 双栏示例（保留 Sidebar，主区域用容器 + Hero + Grid），核心 class 和结构示意：

```tsx
return (
  <div className="flex min-h-screen bg-muted/20">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        {/* Hero 区，渐变 + CTA + 插画占位 */}
        <section className="grid items-center gap-6 rounded-3xl bg-gradient-to-r from-primary/90 to-secondary/80 p-8 text-primary-foreground lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-3">
            <p className="text-sm font-medium opacity-80">AI 报告助理</p>
            <h1 className="text-3xl font-bold">GitLog AI Reporter</h1>
            <p className="text-sm opacity-90">用自然语言生成提交报告，聚焦重要变化。</p>
            <div className="flex flex-wrap gap-3">
              <Button size="sm">生成报告</Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/40 text-primary-foreground"
              >
                查看历史
              </Button>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 shadow-lg backdrop-blur">
            {/* 放置插画 / 几何图形 */}
          </div>
        </section>

        {/* 过滤工具栏卡片 */}
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle>筛选</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input placeholder="按作者/关键词搜索" className="w-56" />
              <Select>... 分支 ...</Select>
              <Select>... 时间范围 ...</Select>
            </div>
          </CardHeader>
        </Card>

        {/* 主体双栏：报告 + 提交列表 */}
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <Card className="min-h-[520px]">
            <CardHeader className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle>报告</CardTitle>
                <CardDescription>汇总 + 重点项</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReportViewer />
            </CardContent>
          </Card>

          <Card className="min-h-[520px]">
            <CardHeader className="flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle>提交列表</CardTitle>
                <CardDescription>最新提交与状态</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="max-h-[480px] space-y-3 overflow-y-auto">
              <CommitList commits={commits} />
            </CardContent>
          </Card>
        </div>

        <p className="pb-4 text-center text-xs text-muted-foreground">M2 Complete</p>
      </div>
    </main>
  </div>
);
```

- Tabs 方案（想进一步减轻宽度压力时）：

```tsx
<Tabs defaultValue="report" className="space-y-4">
  <TabsList>
    <TabsTrigger value="report" className="flex items-center gap-2">
      <BarChart3 className="h-4 w-4" /> 报告
    </TabsTrigger>
    <TabsTrigger value="commits" className="flex items-center gap-2">
      <GitCommit className="h-4 w-4" /> 提交
    </TabsTrigger>
  </TabsList>
  <TabsContent value="report">
    <Card className="min-h-[520px]">
      <CardHeader>…</CardHeader>
      <CardContent>
        <ReportViewer />
      </CardContent>
    </Card>
  </TabsContent>
  <TabsContent value="commits">
    <Card className="min-h-[520px]">
      <CardHeader>…</CardHeader>
      <CardContent className="max-h-[480px] overflow-y-auto">
        <CommitList commits={commits} />
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

- 样式要点（兼容 shadcn）：
  - 容器：`max-w-6xl mx-auto px-6 py-8 space-y-8`，背景用 `bg-muted/20`，卡片保持默认 `Card` 色。
  - Hero：`rounded-3xl bg-gradient-to-r from-primary/90 to-secondary/80 p-8 text-primary-foreground`，右侧可放 AI 生成插画或抽象几何。
  - 列表：给提交列表 `max-h` + `overflow-y-auto`，行距 12–16px，弱分隔线 `border-border/60`。
  - 图标：`BarChart3`、`GitCommit`、`Filter` 等放在标题左侧，尺寸 16px。
  - 字体：在 globals.css 引入标题字体（Space Grotesk/Sora），正文维持系统或 Inter；shadcn 样式无需改动。
