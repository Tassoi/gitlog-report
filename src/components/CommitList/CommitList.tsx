import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
} from '@tanstack/react-table';
import type { Commit } from '../../types';
import { useRepoStore } from '../../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Loader2, X } from 'lucide-react';
import { EmptyState } from '../EmptyState';

interface CommitListProps {
  commits: Commit[];
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

const CommitList = ({
  commits,
  searchKeyword,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
}: CommitListProps) => {
  const { selectedCommits, toggleCommit, repoInfo, commitDiffs, loadingDiffs, loadCommitDiff } =
    useRepoStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleOpenDialog = (commit: Commit) => {
    setSelectedCommit(commit);
    setDialogOpen(true);
    if (repoInfo && !commitDiffs[commit.hash]) {
      loadCommitDiff(repoInfo.path, commit.hash);
    }
  };

  const rowSelection = useMemo(
    () =>
      selectedCommits.reduce(
        (acc, hash) => ({ ...acc, [hash]: true }),
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
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
      },
      {
        accessorKey: 'hash',
        header: 'Hash',
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.hash.substring(0, 7)}
          </Badge>
        ),
      },
      {
        accessorKey: 'message',
        header: 'Message',
        cell: ({ row }) => (
          <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
            {row.original.message}
          </div>
        ),
      },
      {
        accessorKey: 'author',
        header: 'Author',
      },
      {
        accessorKey: 'timestamp',
        header: 'Date',
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
    []
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

      selectedCommits.forEach((hash) => {
        if (!newSelectedHashes.includes(hash)) {
          toggleCommit(hash);
        }
      });

      newSelectedHashes.forEach((hash) => {
        if (!selectedCommits.includes(hash)) {
          toggleCommit(hash);
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
        <CardTitle>Commits</CardTitle>
        <CardDescription>
          {selectedCommits.length > 0
            ? `Selected: ${selectedCommits.length} commit(s)`
            : 'Click to select commits for report generation'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="按作者/关键词搜索"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="选择时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">最近 7 天</SelectItem>
                <SelectItem value="30days">最近 30 天</SelectItem>
                <SelectItem value="3months">最近 3 个月</SelectItem>
                <SelectItem value="6months">最近 6 个月</SelectItem>
              </SelectContent>
            </Select>
            {(searchKeyword || columnFilters.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchChange('');
                  table.resetColumnFilters();
                }}
              >
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {commits.length === 0 ? (
          <EmptyState
            title="No Commits Found"
            description="Try adjusting your time range or search filters"
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
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Rows per page</p>
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
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
                  Loading diff...
                </div>
              ) : commitDiffs[selectedCommit?.hash || ''] ? (
                <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                  {commitDiffs[selectedCommit?.hash || '']}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground p-4">No diff available</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CommitList;
