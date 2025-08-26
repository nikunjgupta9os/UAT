import type { ValidationConfig, ValidationError } from "./type.ts";
import parseCSV from "./parseCSV.ts";
import parseExcel from "./parseExcel.ts";

// For GRN Template
export const grnValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "account",
    "company_code",
    "business_area",
    "document_type",
    // "customer",
    "assignment",
    "document_number",
    "document_date",
    "posting_date",
    // "supplier",
    "reference",
    "amount_in_doc_curr",
    "document_currency",
    "amount_in_local_currency",
    "text",
    "clearing_document",
    "clearing_date",
    "special_gl_ind",
    "offsetting_account",
    "currency_2",
    "company",
  ],
  requiredFields: [
    // "account",
    "company_code",
    "company",
    // "business_area",
    // "document_type",
    "document_number",
    "document_date",
    "posting_date",
    // "supplier",
  ],
  numericFields: ["amount_in_doc_curr", "amount_in_local_currency"],
};

// For PO Template
export const poValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "company_code",
    "controlling_area",
    "entity",
    "entity1",
    "entity2",
    "document_no",
    "lc_indicator",
    "lc_year",
    "contract_date",
    "reference_no",
    "reference_date",
    "vendor_code",
    "vendor_name",
    "price_basis",
    "currency_code",
    "payment_terms",
    "inco_terms",
    "destination_port",
    "payment_to_vendor",
    "uom_code",
    "uom_quantity",
    "net_price",
    "net_value",
    "exchange_rate",
    "exchange_rate_date",
    "documenting",
    "profit_cost_center",
    "entity3",
  ],
  requiredFields: [
    "company_code",
    "controlling_area",
    "entity",
    "document_no",
    "vendor_code",
    "vendor_name",
    "currency_code",
  ],
  numericFields: [
    "uom_quantity",
    "net_price",
    "net_value",
    "exchange_rate",
    "payment_to_vendor",
  ],
};

// For LC Template
export const lcValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "system_lc_number",
    "bank_reference_number",
    "other_references",
    "lc_type",
    "applicant_name",
    "beneficiary_name",
    "issuing_bank",
    "currency",
    "amount",
    "issue_date",
    "expiry_date",
    "linked_po_so_number",
  ],
  requiredFields: [
    "system_lc_number",
    "applicant_name",
    "beneficiary_name",
    "issuing_bank",
    "currency",
    "amount",
  ],
  numericFields: ["amount"],
};

// For SO Template
export const soValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "company_code",
    "controlling_area",
    "entity",
    "entity1",
    "entity2",
    "entity3",
    "document_no",
    "document_type",
    "contract_date",
    "reference_no",
    "reference_date",
    "customer_code",
    "customer_name",
    "currency_code",
    "price_basis",
    "payment_terms",
    "inco_terms",
    "total_invoice_value",
    "last_lot_number",
    "product_description",
    "uom_code",
    "uom_quantity",
    "net_price",
    "net_value",
    "remarks",
    "delivery_date",
    "lc_indicator",
    "exchange_rate_preference",
    "profit_cost_center",
  ],
  requiredFields: [
    "company_code",
    "controlling_area",
    "entity",
    "document_no",
    "document_type",
    "customer_code",
    "customer_name",
    "currency_code",
  ],
  numericFields: [
    "uom_quantity",
    "net_price",
    "net_value",
    "total_invoice_value",
  ],
};

// For Creditor Template
export const creditorValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "payment_block",
    "company_code",
    "business_area",
    "account",
    "pann",
    "gl_account",
    "document_date",
    "net_due_date",
    "posting_date",
    "document_type",
    "posting_key",
    "amount_in_doc_curr",
    "document_currency",
    "local_currency",
    "currency_2",
    "bank_reference",
  ],
  requiredFields: [
    "company_code",
    "business_area",
    "account",
    "document_date",
    "posting_date",
    "document_type",
    "posting_key",
    "amount_in_doc_curuse r",
    "document_currency",
    "bank_reference",
  ],
  numericFields: ["gl_account", "posting_key", "amount_in_doc_curr"],
};

// For Debtors Template
export const debtorsValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "reference",
    "company_code",
    "assignment",
    "document_number",
    "net_due_date",
    "document_type",
    "document_date",
    "posting_date",
    "special_gl_ind",
    "amount_in_local_currency",
    "amount_in_doc_curr",
    "document_currency",
    "text",
    "customer",
    "clearing_document",
    "gl_account",
    "currency_2",
    "company",
    "bank_reference",
  ],
  requiredFields: [
    "company_code",
    "document_number",
    "document_date",
    "posting_date",
    "document_type",
    "customer",
  ],
  numericFields: [
    "amount_in_local_currency",
    "amount_in_doc_curr",
    "gl_account",
  ],
};

export const templates = [
  {
    id: "po",
    name: "PO Template",
    type: "Excel",
    description: "Purchase Order Template",
  },
  {
    id: "lc",
    name: "LC Template",
    type: "Excel",
    description: "Letter of Credit Template",
  },
  {
    id: "so",
    name: "SO Template",
    type: "Excel",
    description: "Sales Order Template",
  },
  {
    id: "grn",
    name: "GRN Template",
    type: "Excel",
    description: "Goods Receipt Note Template",
  },
  {
    id: "creditor",
    name: "Creditor Template",
    type: "Excel",
    description: "Creditor Payment Template",
  },
  {
    id: "debtors",
    name: "Debtors Template",
    type: "Excel",
    description: "Debtors Management Template",
  },
];

export function validateTemplateData(
  data: string[][],
  config: ValidationConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.length === 0) {
    errors.push({ description: "File appears empty or no data" });
    return errors;
  }

  const headers = data[0].map((h) =>
    String(h || "")
      .trim()
      .toLowerCase()
  );

  // Check headers presence and duplicates
  config.requiredHeaders.forEach((requiredHeader) => {
    if (!headers.includes(requiredHeader.toLowerCase())) {
      errors.push({
        description: `Missing required header: ${requiredHeader}`,
      });
    }
  });

  const duplicateHeaders = headers.filter(
    (h, idx) => h !== "" && headers.indexOf(h) !== idx
  );

  if (duplicateHeaders.length > 0) {
    errors.push({
      description: `Duplicate headers found: ${duplicateHeaders.join(", ")}`,
    });
  }

  const requiredFields = config.requiredFields.map((f) => f.toLowerCase());

  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (row.length !== headers.length) {
      errors.push({
        description: `Row ${rowIndex + 1} has ${row.length} columns, expected ${
          headers.length
        }`,
        row: rowIndex + 1,
      });
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowObj[header] = (row[i] || "").trim();
    });

    // Required fields verification
    requiredFields.forEach((field) => {
      if (!rowObj[field] || rowObj[field] === "") {
        errors.push({
          description: `Row ${rowIndex + 1}: '${field}' is required`,
          row: rowIndex + 1,
          column: headers.indexOf(field) + 1,
          currentValue: rowObj[field],
        });
      }
    });

    // Numeric fields validation
    config.numericFields.forEach((field) => {
      const value = rowObj[field.toLowerCase()];
      if (value && isNaN(Number(value.replace(/,/g, "")))) {
        errors.push({
          description: `Row ${rowIndex + 1}: '${field}' must be a valid number`,
          row: rowIndex + 1,
          column: headers.indexOf(field.toLowerCase()) + 1,
          currentValue: value,
        });
      }
    });
  }

  return errors;
}

export const validateFileContent = (
  file: File,
  config: ValidationConfig // Pass config object directly
): Promise<Partial<UploadedFile>> => {
  return new Promise((resolve) => {
    const validationErrors: ValidationError[] = [];
    let rowCount = 0;
    let columnCount = 0;
    let hasHeaders = false;
    let hasMissingValues = false;

    const processData = (data: string[][]) => {
      try {
        if (data.length === 0) {
          resolve({
            status: "error",
            validationErrors: [{ description: "File appears to be empty" }],
            error: "Empty file",
            rowCount: 0,
            columnCount: 0,
            hasHeaders: false,
            hasMissingValues: false,
          });
          return;
        }

        const errors = validateTemplateData(data, config);
        validationErrors.push(...errors);

        const status = validationErrors.length > 0 ? "error" : "success";
        rowCount = data.length > 0 ? data.length - 1 : 0;
        columnCount = data.length > 0 ? data[0].length : 0;
        hasHeaders = data.length > 0;

        const errorDescription =
          validationErrors.length > 0
            ? validationErrors.map((e) => e.description).join(", ")
            : undefined;

        resolve({
          status,
          validationErrors,
          hasHeaders,
          hasMissingValues,
          rowCount,
          columnCount,
          error: errorDescription,
        } as Partial<UploadedFile>);
      } catch (error) {
        resolve({
          status: "error",
          validationErrors: [{ description: "Processing failed" }],
          error: "Processing failed",
        });
      }
    };

    const reader = new FileReader();

    reader.onload = (e) => {
      const fileData = e.target?.result;
      if (!fileData) {
        resolve({
          status: "error",
          validationErrors: [{ description: "File read error" }],
          error: "File read error",
        });
        return;
      }

      try {
        let parsedData: string[][];

        if (file.name.toLowerCase().endsWith(".csv")) {
          parsedData = parseCSV(fileData as string);
        } else if (
          file.name.toLowerCase().endsWith(".xlsx") ||
          file.name.toLowerCase().endsWith(".xls")
        ) {
          parsedData = parseExcel(fileData as ArrayBuffer);
        } else {
          resolve({
            status: "error",
            validationErrors: [
              {
                description:
                  "Unsupported file format. Only CSV and Excel files are supported.",
              },
            ],
            error: "Unsupported format",
          });
          return;
        }

        processData(parsedData);
      } catch (error) {
        resolve({
          status: "error",
          validationErrors: [
            {
              description: `Failed to parse file: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          error: "Parsing failed",
        });
      }
    };

    reader.onerror = () => {
      resolve({
        status: "error",
        validationErrors: [{ description: "Failed to read file" }],
        error: "File read error",
      });
    };

    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

export const validatePreviewData = (
  data: string[][],
  config: ValidationConfig
): ValidationError[] => {
  const errors = validateTemplateData(data, config);
  return errors;
};
