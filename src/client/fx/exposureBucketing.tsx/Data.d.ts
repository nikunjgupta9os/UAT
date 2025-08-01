interface ExposureBucketing {
  id: string;
  reference_no?: string;
  type?: string;
  business_unit?: string;
  vendor_beneficiary?: string;
  po_amount: number;
  po_currency?: string;
  maturity_expiry_date?: string;
  status_bucketing?: string;
  updated_at?: string;
  advance: number;
  remarks: string;
  inco: string;
  month_1: number;
  month_2: number;
  month_3: number;
  month_4_6: number;
  month_6plus: number;
}

interface ExposureBucketing extends WithId {
  id: string;
  reference_no?: string;
  type?: string;
  business_unit?: string;
  vendor_beneficiary?: string;
  po_amount: number;
  po_currency?: string;
  maturity_expiry_date?: string;
  status_bucketing?: string;
  updated_at?: string;
  advance: number;
  remarks: string;
  inco: string;
  month_1: number;
  month_2: number;
  month_3: number;
  month_4_6: number;
  month_6plus: number;
}