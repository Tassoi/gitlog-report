import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
} from '@tanstack/react-table';
import type { Commit, Report, ReportTemplate } from '../../types';
import { useRepoStore } from '../../store';
import { useReportStore } from '../../store';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
  FileText,
  Calendar,
  FolderGit2,
  User,
} from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { toast } from 'sonner';
import { type DateRange } from 'react-day-picker';
import { format } from 'date-fns';

let globalListener: UnlistenFn | null = null;

interface CommitListProps {
  commits: Commit[];
  allCommits?: Commit[];
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (value: DateRange | undefined) => void;
  repoFilter?: string;
  onRepoFilterChange?: (value: string) => void;
}

const CommitList = ({
  commits,
  allCommits,
  searchKeyword,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onRepoFilterChange,
}: CommitListProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    selectedCommits,
    toggleCommit,
    commitDiffs,
    loadingDiffs,
    loadCommitDiff,
    activeRepos,
    currentRepoId,
  } = useRepoStore();
  const { setReport, isGenerating, setGenerating } = useReportStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<(Commit & { repoId?: string }) | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Report generation state
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Listen for streaming progress
  useEffect(() => {
    let cancelled = false;
    const setupListener = async () => {
      if (globalListener) return;
      try {
        const unlisten = await listen<string>('report-generation-progress', (event) => {
          setStreamingContent((prev) => prev + event.payload);
        });
        if (cancelled) {
          unlisten();
          return;
        }
        globalListener = unlisten;
      } catch (error) {
        console.error('Failed to setup listener:', error);
      }
    };
    setupListener();
    return () => {
      cancelled = true;
      if (globalListener) {
        globalListener();
        globalListener = null;
      }
    };
  }, []);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const allTemplates = await invoke<ReportTemplate[]>('list_templates');
        setTemplates(allTemplates);
        const typeTemplates = allTemplates.filter((t) => t.type === reportType);
        const defaultTemplate = typeTemplates.find((t) => t.isDefault) || typeTemplates[0];
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    loadTemplates();
  }, []);

  // Update template when report type changes
  useEffect(() => {
    const typeTemplates = templates.filter((t) => t.type === reportType);
    const defaultTemplate = typeTemplates.find((t) => t.isDefault) || typeTemplates[0];
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [reportType, templates]);

  const handleOpenDialog = (commit: Commit & { repoId?: string }) => {
    setSelectedCommit(commit);
    setDialogOpen(true);
    if (commit.repoId && !commitDiffs[commit.hash]) {
      loadCommitDiff(commit.hash, commit.repoId);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setStreamingContent('');

      const selectedCommitObjects = commits.filter((c: any) =>
        selectedCommits.some((sc: any) => sc.hash === c.hash && sc.repoId === c.repoId)
      );
      const commitsToUse = selectedCommitObjects;

      const commitsByRepo = new Map<string, any[]>();
      commitsToUse.forEach((commit: any) => {
        const repoId = commit.repoId || currentRepoId;
        if (!repoId) return;
        if (!commitsByRepo.has(repoId)) {
          commitsByRepo.set(repoId, []);
        }
        commitsByRepo.get(repoId)!.push(commit);
      });

      const repoGroups = Array.from(commitsByRepo.entries()).map(([repoId, commits]) => {
        const repoData = activeRepos.get(repoId);
        return {
          repo_id: repoId,
          repo_name: repoData?.repoInfo.name || t('未知仓库'),
          repo_path: repoData?.repoInfo.path || '',
          commits,
        };
      });

      const commandName =
        reportType === 'weekly' ? 'generate_weekly_report' : 'generate_monthly_report';
      const reportTypeName = reportType === 'weekly' ? t('周报') : t('月报');

      const report = await invoke<Report>(commandName, {
        repoGroups,
        templateId: selectedTemplateId || null,
      });

      const enrichedReport: Report = {
        ...report,
        id: report.id || crypto.randomUUID(),
        name: `${reportTypeName} - ${new Date().toLocaleDateString()}`,
        lastModified: Math.floor(Date.now() / 1000),
        repoIds: Array.from(commitsByRepo.keys()),
      };

      setReport(enrichedReport);
      toast.success(t('生成成功', { type: reportTypeName }));
      setReportDialogOpen(false);
      navigate('/reports');
    } catch (err) {
      console.error(`生成失败:`, err);
      toast.error(
        t('生成失败', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setGenerating(false);
    }
  };

  const currentTypeTemplates = templates.filter((t) => t.type === reportType);

  const uniqueAuthors = useMemo(() => {
    const authors = new Set<string>();
    (allCommits || commits).forEach((c: any) => authors.add(c.author));
    return Array.from(authors).sort();
  }, [allCommits, commits]);

  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');

  const rowSelection = useMemo(
    () =>
      selectedCommits.reduce(
        (acc: any, sc: any) => ({ ...acc, [sc.hash]: true }),
        {} as Record<string, boolean>
      ),
    [selectedCommits]
  );

  const columns = useMemo<ColumnDef<Commit>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('选择全部')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('选择行')}
          />
        ),
      },
      {
        accessorKey: 'hash',
        header: t('哈希'),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.hash.substring(0, 7)}
          </Badge>
        ),
      },
      {
        accessorKey: 'repoId',
        header: t('仓库'),
        cell: ({ row }) => {
          const repoId = (row.original as any).repoId;
          if (!repoId) return null;
          const repoData = activeRepos.get(repoId);
          return repoData ? (
            <Badge variant="secondary" className="text-xs">
              {repoData.repoInfo.name}
            </Badge>
          ) : null;
        },
      },
      {
        accessorKey: 'message',
        header: t('提交信息'),
        cell: ({ row }) => (
          <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
            {row.original.message}
          </div>
        ),
      },
      {
        accessorKey: 'author',
        header: t('作者'),
      },
      {
        accessorKey: 'timestamp',
        header: t('日期'),
        cell: ({ row }) => new Date(row.original.timestamp * 1000).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row.original)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [activeRepos, t]
  );

  const table = useReactTable({
    data: commits,
    columns,
    state: { rowSelection, columnFilters },
    getRowId: (row) => row.hash,
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      const newSelectedHashes = Object.keys(newSelection).filter((hash) => newSelection[hash]);

      selectedCommits.forEach((sc: any) => {
        if (!newSelectedHashes.includes(sc.hash)) {
          toggleCommit(sc.hash, sc.repoId);
        }
      });

      newSelectedHashes.forEach((hash) => {
        if (!selectedCommits.some((sc: any) => sc.hash === hash)) {
          const commit = commits.find((c) => c.hash === hash) as any;
          if (commit && commit.repoId) {
            toggleCommit(hash, commit.repoId);
          }
        }
      });
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('提交列表')}</CardTitle>
        <CardDescription>
          {selectedCommits.length > 0
            ? t('已选择提交', { count: selectedCommits.length })
            : t('点击选择提交生成报告')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <User className="mr-2 h-4 w-4" />
                  {selectedAuthor === 'all' ? t('所有作者') : selectedAuthor}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedAuthor('all');
                    onSearchChange('');
                  }}
                >
                  {t('所有作者')}
                </DropdownMenuItem>
                {uniqueAuthors.map((author) => (
                  <DropdownMenuItem
                    key={author}
                    onClick={() => {
                      setSelectedAuthor(author);
                      onSearchChange(`EXACT:${author}`);
                    }}
                  >
                    {author}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, 'MM/dd/yyyy')} - ${format(dateRange.to, 'MM/dd/yyyy')}`
                    : t('选择日期范围')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent mode="range" selected={dateRange} onSelect={onDateRangeChange} />
              </PopoverContent>
            </Popover>
            {activeRepos.size > 1 && onRepoFilterChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <FolderGit2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRepoFilterChange('all')}>
                    {t('全部仓库')}
                  </DropdownMenuItem>
                  {Array.from<[string, any]>(activeRepos.entries()).map(([id, { repoInfo }]) => (
                    <DropdownMenuItem key={id} onClick={() => onRepoFilterChange(id)}>
                      {repoInfo.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {(searchKeyword || columnFilters.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchChange('');
                  table.resetColumnFilters();
                }}
              >
                {t('重置')}
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            onClick={() => setReportDialogOpen(true)}
            size="sm"
            disabled={selectedCommits.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t('生成报告')}
          </Button>
        </div>

        {commits.length === 0 ? (
          <EmptyState
            title={t('未找到提交标题')}
            description={t('尝试调整时间范围或搜索过滤条件')}
          />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        {t('没有结果')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="flex-1 text-sm text-muted-foreground">
                {t('行选择统计', {
                  selected: table.getFilteredSelectedRowModel().rows.length,
                  total: table.getFilteredRowModel().rows.length,
                })}
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{t('每页行数')}</p>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="h-8 w-[70px] rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {[10, 25, 50, 100].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    {t('分页统计', {
                      page: table.getState().pagination.pageIndex + 1,
                      total: table.getPageCount(),
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('生成报告')}</DialogTitle>
              <DialogDescription>
                {selectedCommits.length > 0
                  ? t('基于选中的提交', { count: selectedCommits.length })
                  : t('基于所有提交')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('报告类型')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={reportType === 'weekly' ? 'default' : 'outline'}
                    onClick={() => setReportType('weekly')}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t('周报')}
                  </Button>
                  <Button
                    variant={reportType === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setReportType('monthly')}
                    className="flex-1"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {t('月报')}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('选择模板')}</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('选择模板')} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentTypeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        {template.isDefault && ` ${t('默认')}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating || !selectedTemplateId}
                className="w-full"
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? t('生成中') : t('生成报告')}
              </Button>

              {isGenerating && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <CardTitle className="text-base">{t('生成中')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/30 p-4">
                      <pre className="whitespace-pre-wrap text-xs">
                        {streamingContent || t('等待响应')}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-start gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedCommit?.hash.substring(0, 7)}
                </Badge>
                <span className="line-clamp-3">{selectedCommit?.message}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedCommit?.author} •{' '}
                {selectedCommit && new Date(selectedCommit.timestamp * 1000).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {loadingDiffs.has(selectedCommit?.hash || '') ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('加载Diff')}
                </div>
              ) : commitDiffs[selectedCommit?.hash || ''] ? (
                <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                  {commitDiffs[selectedCommit?.hash || '']}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground p-4">{t('无可用Diff')}</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CommitList;
