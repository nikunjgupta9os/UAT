// For Payables Template
import type { ValidationConfig } from "../../fx/exposureUpload.tsx/UPLOADER/type.ts";

const payablesValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "vendor_name",
    "invoice",
    "invoice_date",
    "due_date",
    "invoice_amount",
    "currency",
  ],
  requiredFields: [
    "vendor_name",
    "invoice",
    "invoice_date",
    "due_date",
    "invoice_amount",
    "currency",
  ],
  numericFields: ["invoice_amount"],
};

// For Receivables Template
const receivablesValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "customer_name",
    "invoice",
    "invoice_date",
    "due_date",
    "invoice_amount",
    "currency",
  ],
  requiredFields: [
    "customer_name",
    "invoice",
    "invoice_date",
    "due_date",
    "invoice_amount",
    "currency",
  ],
  numericFields: ["invoice_amount"],
};
type Template = {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  headers?: string[];
  sampleRow?: any[];
};

const templates: Template[] = [
  {
    id: "payables",
    name: "Payables Template",
    type: "Excel",
    description: "Vendor Payables Template",
    headers: [
      "vendor_name", "invoice", "invoice_date", "due_date", "invoice_amount", "currency"
    ],
    sampleRow: [
      "Vendor ABC Ltd", "INV001", "2025-07-21", "2025-08-21", "50000", "USD"
    ],
  },
  {
    id: "receivables",
    name: "Receivables Template",
    type: "Excel",
    description: "Customer Receivables Template",
    headers: [
      "customer_name", "invoice", "invoice_date", "due_date", "invoice_amount", "currency"
    ],
    sampleRow: [
      "Customer XYZ Co", "INV002", "2025-07-21", "2025-08-21", "37500", "USD"
    ],
  },
  // Add other templates here similarly...
];

const RECEIVABLE_TEMPLATE = {
  id: "receivable",
  name: "Receivable Template",
  headers: [
    "customer_name",
    "invoice",
    "invoice_date",
    "due_date",
    "invoice_amount",
    "currency"
  ],
  sampleRow: [
    "Customer XYZ Co",
    "INV002",
    "2025-07-21",
    "2025-08-21",
    "37500",
    "USD"
  ]
};

const PAYABLE_TEMPLATE = {
  id: "payables",
  name: "Payables Template",
  headers: [
    "vendor_name",
    "invoice",
    "invoice_date",
    "due_date",
    "invoice_amount",
    "currency"
  ],
  sampleRow: [
    "Vendor ABC Ltd",
    "INV001",
    "2025-07-21",
    "2025-08-21",
    "50000",
    "USD"
  ]
};

export {
    PAYABLE_TEMPLATE,
    RECEIVABLE_TEMPLATE,
    templates,
    payablesValidationConfig,
    receivablesValidationConfig
}