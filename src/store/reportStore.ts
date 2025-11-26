// Zustand store for report state

import { create } from 'zustand';
import type { Report } from '../types';

interface ReportStore {
  currentReport: Report | null;
  isGenerating: boolean;
  setReport: (report: Report | null) => void;
  setGenerating: (generating: boolean) => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  currentReport: null,
  isGenerating: false,

  setReport: (report) => set({ currentReport: report }),
  setGenerating: (generating) => set({ isGenerating: generating }),
}));
