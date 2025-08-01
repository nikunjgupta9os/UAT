interface HedgingProposal {
  BusinessUnit: string;
  Currency: string;
  Month1: number;
  Month2: number;
  Month3: number;
  Month4to6: number;
  MonthMoreThan6: number;
  Remarks?: string;
  Status?: string;
}