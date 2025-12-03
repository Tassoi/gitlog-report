import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh]">
      <div className="p-8 flex flex-col items-center gap-6 text-center justify-center mx-auto">
        <img src="/logo_round.png" alt="Commitly" className="h-40 w-40 object-contain" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('404标题')}</h1>
          <p className="text-muted-foreground">{t('404描述')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/')}>{t('返回仪表盘')}</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t('返回上一页')}
          </Button>
        </div>
      </div>
    </div>
  );
}
