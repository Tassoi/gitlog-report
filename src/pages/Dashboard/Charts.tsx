'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Commit } from '@/types';

// === 数据聚合工具 ===
export function groupCommitsByDay(commits: Commit[], days = 30) {
  const start = Date.now() - days * 86_400_000;
  const map = new Map<string, number>();
  commits.forEach((c) => {
    const t = c.timestamp * 1000;
    if (t >= start) {
      const d = new Date(t).toISOString().slice(0, 10); // YYYY-MM-DD
      map.set(d, (map.get(d) ?? 0) + 1);
    }
  });
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + i * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
  return dates.map((date) => ({ date, count: map.get(date) ?? 0 }));
}

export function topAuthors(commits: Commit[], limit = 5) {
  const map = new Map<string, number>();
  commits.forEach((c) => map.set(c.author, (map.get(c.author) ?? 0) + 1));
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([author, count]) => ({ author, count }));
}

export function commitTypes(commits: Commit[]) {
  const buckets = { feat: 0, fix: 0, docs: 0, refactor: 0, other: 0 };
  commits.forEach((c) => {
    const msg = c.message.toLowerCase();
    if (msg.startsWith('feat')) buckets.feat++;
    else if (msg.startsWith('fix')) buckets.fix++;
    else if (msg.startsWith('docs')) buckets.docs++;
    else if (msg.startsWith('refactor')) buckets.refactor++;
    else buckets.other++;
  });
  return Object.entries(buckets).map(([type, count]) => ({ type, count }));
}

// === 图表组件 ===
export function CommitTrendChart({ commits }: { commits: Commit[] }) {
  const { t } = useTranslation();
  const data = useMemo(() => groupCommitsByDay(commits, 30), [commits]);
  const config = useMemo<ChartConfig>(
    () => ({
      count: { label: t('提交数'), color: 'var(--chart-3)' },
    }),
    [t]
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch border-b px-6 pt-4 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1  pb-3 sm:!py-0">
          <CardTitle>{t('最近30天提交趋势')}</CardTitle>
          <CardDescription>{t('每日提交量说明')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <YAxis allowDecimals={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  nameKey="count"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }
                />
              }
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AuthorRadialChart({ commits }: { commits: Commit[] }) {
  const { t } = useTranslation();
  const top = useMemo(() => topAuthors(commits, 5), [commits]);
  const palette = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ];
  const chartData = top.map((item, idx) => ({
    author: item.author || t('未知作者'),
    commits: item.count,
    fill: palette[idx % palette.length],
  }));

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      commits: { label: t('提交数') },
      author: { label: t('作者') },
    }),
    [t]
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t('前5名作者')}</CardTitle>
        <CardDescription>{t('按提交次数排序')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
          <RadialBarChart data={chartData} innerRadius={20} outerRadius={110}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="author" />}
            />
            <RadialBar dataKey="commits" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground leading-none">{t('前5名作者提交说明')}</div>
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2">
          {chartData.map((item) => (
            <div
              key={item.author}
              className="flex items-center justify-between rounded-md border px-2 py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill as string }}
                />
                <span className="truncate text-sm font-medium">{item.author}</span>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{item.commits}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

export function CommitTypeChart({ commits }: { commits: Commit[] }) {
  const { t } = useTranslation();
  const data = useMemo(() => commitTypes(commits), [commits]);
  const config = useMemo<ChartConfig>(
    () => ({
      commits: { label: t('提交数'), color: 'var(--chart-1)' },
      feat: { label: t('特性'), color: 'var(--chart-1)' },
      fix: { label: t('修复'), color: 'var(--chart-2)' },
      docs: { label: t('文档'), color: 'var(--chart-3)' },
      refactor: { label: t('重构'), color: 'var(--chart-4)' },
      other: { label: t('其他'), color: 'var(--chart-5)' },
    }),
    [t]
  );

  const pieData = data.map((item, idx) => ({
    type: item.type,
    commits: item.count,
    fill: config[item.type as keyof typeof config]?.color ?? `var(--chart-${(idx % 5) + 1})`,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t('提交类型分布')}</CardTitle>
        <CardDescription>{t('基于提交信息前缀统计')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="type" />} />
            <Pie
              data={pieData}
              dataKey="commits"
              label={(entry) =>
                (config[entry.type as keyof typeof config]?.label as string) ?? entry.type
              }
              nameKey="type"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground leading-none">{t('提交类型统计说明')}</div>
        <div className="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{t('类型总数', { count: pieData.length })}</span>
          <span>{t('总提交数统计', { count: pieData.reduce((acc, cur) => acc + cur.commits, 0) })}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
