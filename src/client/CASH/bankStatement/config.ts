import type { ValidationConfig } from "../../fx/exposureUpload.tsx/UPLOADER/type.ts";

type Template = {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  headers?: string[];
  sampleRow?: any[];
};

const centreValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "centre_code",
    "centre_name",
    "centre_type",
    "business_unit",
    "owner_manager",
  ],
  requiredFields: [
    "centre_code",
    "centre_name",
    "centre_type",
    "business_unit",
    "owner_manager",
  ],
  numericFields: [],
};

const bankStatementValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "BankStatementID",
    "TransactionID",
    "Amount",
    "Date",
    "Description",
  ],
  requiredFields: [
    "BankStatementID",
    "TransactionID",
    "Amount",
    "Date",
    "Description",
  ],
  numericFields: ["Amount"], 
};

const templates: Template[] = [
  {
    id: "centre",
    name: "Centre Template",
    type: "Excel",
    description: "Centre details template",
    headers: [
      "centre_code",
      "centre_name",
      "centre_type",
      "business_unit",
      "owner_manager",
    ],
    sampleRow: [
      "C001",
      "New York Finance Centre",
      "Regional",
      "Finance Division",
      "John Doe",
    ],
  },
  {
    id: "bank_statement",
    name: "Bank Statement Template",
    type: "Excel",
    description: "Bank statement transaction details template",
    headers: [
      "BankStatementID",
      "TransactionID",
      "Amount",
      "Date",
      "Description",
    ],
    sampleRow: [
      "BS001",
      "TXN12345",
      "5000.75",
      "2025-08-26",
      "Salary Payment",
    ],
  },
];

export { templates, centreValidationConfig, bankStatementValidationConfig };
