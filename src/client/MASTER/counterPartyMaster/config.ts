import type { ValidationConfig } from "../../fx/exposureUpload.tsx/UPLOADER/type.ts";

type Template = {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  headers?: string[];
  sampleRow?: any[];
};

const counterpartyValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "counterparty_code",
    "legal_name",
    "counterparty_type",
    "tax_id_business_id",
    "address",
  ],
  requiredFields: [
    "counterparty_code",
    "legal_name",
    "counterparty_type",
    "tax_id_business_id",
    "address",
  ],
  numericFields: [],
};

const templates: Template[] = [
  {
    id: "counterparty",
    name: "Counterparty Template",
    type: "Excel",
    description: "Counterparty details template",
    headers: [
      "counterparty_code",
      "legal_name",
      "counterparty_type",
      "tax_id_business_id",
      "address",
    ],
    sampleRow: [
      "CP001",
      "Legal Name Ltd",
      "Type A",
      "TAX123456",
      "1234 Elm Street, City, Country",
    ],
  },
];

export { templates, counterpartyValidationConfig };
