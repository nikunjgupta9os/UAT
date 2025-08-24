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
  numericFields: [], // Add here if any field like centre_code should be restricted to numeric only
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
];

export { templates, centreValidationConfig };
