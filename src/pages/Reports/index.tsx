import { useReportStore } from '@/store/reportStore';
import { useTranslation } from 'react-i18next';
import ReportViewer from '@/components/ReportViewer';
import { EmptyState } from '@/components/EmptyState';

export function Reports() {
  const { currentReportId } = useReportStore();
  const { t } = useTranslation();

  return (
    <div className="p-6 h-full flex gap-6">
      <div className="flex-1">
        {currentReportId ? (
          <ReportViewer />
        ) : (
          <EmptyState
            title={t('选择一个报告')}
            description={t('选择报告查看详情')}
          />
        )}
      </div>
    </div>
  );
}
