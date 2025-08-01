// utils.ts

export type LinkedSummaryData = {
  srNo: number;
  exposureId: string;
  forwardId: string;
  linkedAmount: number;
};

export const mockLinkedSummaryData: LinkedSummaryData[] = [
  {
    srNo: 1,
    exposureId: "EXP001",
    forwardId: "FWD001",
    linkedAmount: 250000,
  },
  {
    srNo: 2,
    exposureId: "EXP002",
    forwardId: "FWD002",
    linkedAmount: 180000,
  },
  {
    srNo: 3,
    exposureId: "EXP003",
    forwardId: "FWD003",
    linkedAmount: 320000,
  },
  {
    srNo: 4,
    exposureId: "EXP004",
    forwardId: "FWD004",
    linkedAmount: 150000,
  },
];
