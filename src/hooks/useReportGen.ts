// Custom hook for report generation

import { invoke } from '@tauri-apps/api/core';
import type { Commit, Report } from '../types';

export const useReportGen = () => {
  const generateWeeklyReport = async (commits: Commit[]): Promise<Report> => {
    return await invoke<Report>('generate_weekly_report', { commits });
  };

  const generateMonthlyReport = async (commits: Commit[]): Promise<Report> => {
    return await invoke<Report>('generate_monthly_report', { commits });
  };

  const exportReport = async (report: Report, format: string): Promise<string> => {
    return await invoke<string>('export_report', { report, format });
  };

  return {
    generateWeeklyReport,
    generateMonthlyReport,
    exportReport,
  };
};
