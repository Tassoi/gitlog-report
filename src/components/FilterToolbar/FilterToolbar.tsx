import { Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRepoStore } from '../../store';

interface FilterToolbarProps {
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

const FilterToolbar = ({
  searchKeyword,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
}: FilterToolbarProps) => {
  const { repoInfo } = useRepoStore();

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">
            筛选
            {repoInfo && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {repoInfo.name} ({repoInfo.branch})
              </span>
            )}
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="按作者/关键词搜索"
            className="w-56"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">最近 7 天</SelectItem>
              <SelectItem value="30days">最近 30 天</SelectItem>
              <SelectItem value="3months">最近 3 个月</SelectItem>
              <SelectItem value="6months">最近 6 个月</SelectItem>
              <SelectItem value="custom" disabled>
                自定义范围（M3）
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
    </Card>
  );
};

export default FilterToolbar;
