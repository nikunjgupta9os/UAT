import type { FinanceEntry } from "./finance";
import type { ChartType } from "./chartMetadata";

export interface DashboardChart {
  id: string;
  title?: string;
  chartType: ChartType;
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

// Re-export ChartType so it can be imported from this file
export type { ChartType } from "./chartMetadata";