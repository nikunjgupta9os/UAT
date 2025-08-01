// stores/useDashboardStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ChartType } from '../types/chartMetadata'; // ✅ Required
import type { FinanceEntry } from '../types/finance'; // ✅ Optional but good for accuracy

interface DashboardChart {
  id: string;
  title?: string;
  chartType: ChartType; // ✅ Correctly typed
  metric: keyof FinanceEntry;
  data: FinanceEntry[];
  layout: {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface DashboardStore {
  charts: DashboardChart[];
  addChart: (chart: DashboardChart) => void;
  removeChart: (id: string) => void;
  updateChartTitle: (id: string, title: string) => void;
  updateLayout: (charts: DashboardChart[]) => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      charts: [],
      addChart: (chart) => set((state) => ({ charts: [...state.charts, chart] })),
      removeChart: (id) => set((state) => ({ charts: state.charts.filter((c) => c.id !== id) })),
      updateChartTitle: (id, title) => 
        set((state) => ({
          charts: state.charts.map((c) => 
            c.id === id ? { ...c, title } : c
          )
        })),
      updateLayout: (updatedCharts) => 
      set({
        charts: updatedCharts.map((chart) => ({
          ...chart,
          layout: {
            ...chart.layout,
            x: Number(chart.layout.x ?? 0),
            y: Number.isFinite(chart.layout.y) ? chart.layout.y : 0, // 💡 Fix here
            w: Number(chart.layout.w ?? 6),
            h: Number(chart.layout.h ?? 2),
            i: chart.layout.i ?? chart.id, // fallback if needed
          }
        }))
      }),
      reset: () => set({ charts: [] }),
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);