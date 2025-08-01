 type ExposureRow = {
   bu: string;
   currency: string;
   type: string;
   id: string;
   client: string;
   amount: number;
   maturityDate: string;
   maturityBucket: string;
 };
 
 export const fxRates: Record<string, number> = {
   USD: 1,
   EUR: 1.1,
   CHF: 1.05,
   JPY: 0.0065,
 };
 
 type ForwardRow = {
   dealId: string;
   bank: string;
   bu: string;
   fcy: string;
   lcy: string;
   fcyAmount: number;
   spotRate: number;
   forwardRate: number;
   marginBps: number;
   lcyValue: number;
   maturityDate: string;
   dealDate: string;
 };
 
 export const forwardData: ForwardRow[] = [
   { dealId: "FWD-010", bank: "JPMorgan", bu: "Healthcare", fcy: "CHF", lcy: "INR", fcyAmount: 4205.31, spotRate: 92.0632, forwardRate: 91.8890, marginBps: 15, lcyValue: 386421.62, maturityDate: "1/7/2025", dealDate: "20/5/2025" },
   { dealId: "FWD-007", bank: "Goldman Sachs", bu: "Logistics", fcy: "EUR", lcy: "INR", fcyAmount: 0, spotRate: 90.4945, forwardRate: 90.5568, marginBps: 12, lcyValue: 0, maturityDate: "10/7/2025", dealDate: "4/6/2025" },
   { dealId: "FWD-012", bank: "HSBC", bu: "Technology", fcy: "CAD", lcy: "INR", fcyAmount: 5946.81, spotRate: 60.6382, forwardRate: 60.6460, marginBps: 15, lcyValue: 360650.26, maturityDate: "10/7/2025", dealDate: "6/6/2025" },
   { dealId: "FWD-001", bank: "Goldman Sachs", bu: "Technology", fcy: "USD", lcy: "INR", fcyAmount: 12114.63, spotRate: 83.5136, forwardRate: 83.5329, marginBps: 12, lcyValue: 1011970.39, maturityDate: "15/7/2025", dealDate: "18/4/2025" },
   { dealId: "FWD-009", bank: "Citi", bu: "Energy", fcy: "USD", lcy: "INR", fcyAmount: 18000, spotRate: 83.00, forwardRate: 82.75, marginBps: 10, lcyValue: 1494000.00, maturityDate: "5/8/2025", dealDate: "1/7/2025" },
   { dealId: "FWD-011", bank: "JPMorgan", bu: "Energy", fcy: "EUR", lcy: "INR", fcyAmount: 10000, spotRate: 90.00, forwardRate: 89.95, marginBps: 9, lcyValue: 900000.00, maturityDate: "20/9/2025", dealDate: "20/7/2025" },
 ];
 
 
 export const exposureData: ExposureRow[] = [
   { bu: "Energy", currency: "USD", type: "BS", id: "BS001", client: "Treasury GL", amount: 10000, maturityDate: "1/8/2025", maturityBucket: "Month 2" },
   { bu: "Energy", currency: "USD", type: "LC", id: "LC877", client: "Vendor A", amount: 15000, maturityDate: "5/8/2025", maturityBucket: "Month 2" },
   { bu: "Energy", currency: "EUR", type: "PO", id: "PO123", client: "Supplier X", amount: 9000, maturityDate: "20/9/2025", maturityBucket: "Month 3" },
   { bu: "Healthcare", currency: "CHF", type: "BS", id: "BS002", client: "GL Y", amount: 5000, maturityDate: "1/7/2025", maturityBucket: "Month 1" },
   { bu: "Healthcare", currency: "CHF", type: "LC", id: "LC999", client: "Vendor B", amount: 3000, maturityDate: "2/8/2025", maturityBucket: "Month 2" },
   { bu: "Healthcare", currency: "USD", type: "BS", id: "BS003", client: "GL Z", amount: 4000, maturityDate: "3/9/2025", maturityBucket: "Month 3" },
   { bu: "Manufacturing", currency: "JPY", type: "LC", id: "LC201", client: "Beneficiary Z", amount: 20000, maturityDate: "15/11/2025", maturityBucket: "4-6 Months" },
   { bu: "Manufacturing", currency: "JPY", type: "PO", id: "PO401", client: "Supplier Q", amount: 22000, maturityDate: "10/10/2025", maturityBucket: "4-6 Months" },
 ];
 
 export const format = (num: number, currency = "USD") =>
   num.toLocaleString("en-US", { style: "currency", currency });