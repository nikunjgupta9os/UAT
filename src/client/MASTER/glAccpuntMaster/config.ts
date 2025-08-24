import type { ValidationConfig } from "../../fx/exposureUpload.tsx/UPLOADER/type.ts";

type Template = {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  headers?: string[];
  sampleRow?: any[];
};

const glAccountValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "gl_account_code",
    "gl_account_name",
    "gl_account_type",
  ],
  requiredFields: [
    "gl_account_code",
    "gl_account_name",
    "gl_account_type",
  ],
  numericFields: [], // Add here if e.g. "gl_account_code" should be numeric
};

const templates: Template[] = [
  {
    id: "gl_account",
    name: "GL Account Template",
    type: "Excel",
    description: "General Ledger Account details template",
    headers: [
      "gl_account_code",
      "gl_account_name",
      "gl_account_type",
    ],
    sampleRow: [
      "1001",
      "Cash Account",
      "Asset",
    ],
  },
];

export { templates, glAccountValidationConfig };
