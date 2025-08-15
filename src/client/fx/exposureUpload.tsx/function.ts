// import * as XLSX from 'xlsx';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const parseCSV = (text: string): string[][] => {
  const lines = text.split("\n").filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  });
};

const grnHeaders = [
  "account",
  "company_code",
  "business_area",
  "document_type",
  "customer",
  "assignment",
  "document_number",
  "document_date",
  "posting_date",
  "supplier",
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
];

const creditorHeaders = [
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
  "bank_reference", // This must be present
];

const debtorsHeaders = [
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
  "bank_reference", // This must be present
];

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

// Headers for each template type
const poHeaders = [
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
];

const lcHeaders = [
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
];

const soHeaders = [
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
];

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status?: "pending" | "processing" | "success" | "error";
  uploadDate: Date;
  error?: string;
  validationErrors?: ifValidationError[];
  hasHeaders?: boolean;
  hasMissingValues?: boolean;
  rowCount?: number;
  columnCount?: number;
  file?: File;
}

const parseExcel = (arrayBuffer: ArrayBuffer): string[][] => {
  try {
    // Read the workbook from array buffer
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert worksheet to array of arrays
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use array of arrays format
      defval: "", // Default value for empty cells
      raw: false, // Convert all values to strings
    });

    // Filter out completely empty rows and convert all values to strings
    const filteredData = data
      .filter((row) =>
        row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
      )
      .map((row) => row.map((cell) => String(cell || "").trim()));

    return filteredData;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error(
      "Failed to parse Excel file. Please ensure it's a valid Excel file."
    );
  }
};

// Function to get expected headers based on template type
const getExpectedHeaders = (templateType?: string): string[] => {
  switch (templateType) {
    case "po":
      return poHeaders;
    case "lc":
      return lcHeaders;
    case "so":
      return soHeaders;
    case "grn":
      return grnHeaders;
    case "creditor":
      return creditorHeaders;
    case "debtors":
      return debtorsHeaders;
    default:
      return soHeaders; // Default to SO headers
  }
};

// Function to get required fields based on template type
const getRequiredFields = (templateType?: string): string[] => {
  switch (templateType) {
    case "po":
      return [
        "company_code",
        "controlling_area",
        "entity",
        "document_no",
        "reference_no",
        "vendor_code",
        "vendor_name",
        "currency_code",
      ];
    case "lc":
      return [
        "system_lc_number",
        "applicant_name",
        "beneficiary_name",
        "issuing_bank",
        "currency",
        "amount",
      ];
    case "so":
      return [
        "company_code",
        "controlling_area",
        "entity",
        "document_no",
        "reference_no",
        "customer_code",
        "customer_name",
        "currency_code",
      ];
    case "grn":
      return [
        "account",
        "company_code",
        "business_area",
        "document_type",
        "document_number",
        "document_date",
        "posting_date",
        "supplier",
        "reference",
        "amount_in_doc_curr",
        "document_currency",
        "amount_in_local_currency",
      ];
    case "creditor":
      return [
        "company_code",
        "business_area",
        "account",
        "document_date",
        "posting_date",
        "document_type",
        "posting_key",
        "amount_in_doc_curr",
        "document_currency",
      ];
    case "debtors":
      return [
        "company_code",
        "document_number",
        "document_date",
        "posting_date",
        "document_type",
        "customer",
        "amount_in_doc_curr",
        "document_currency",
        "amount_in_local_currency",
      ];
    default:
      return [
        "company_code",
        "bank_reference",
        "amount_in_doc_curr",
        "document_currency",
      ];
  }
};

interface ifValidationError {
  description: string;
  row?: number;
  column?: number;
  currentValue?: string;
}

const validateColumns = (
  data: string[][],
  ifValidationErrors: ifValidationError[],
  templateType?: string
) => {
  if (data.length === 0) {
    ifValidationErrors.push({
      description: "File appears to be empty or has no readable data",
    });
    return;
  }

  const headers = data[0].map((h) =>
    String(h || "")
      .trim()
      .toLowerCase()
  );
  const expectedHeaders = getExpectedHeaders(templateType);

  // Check for completely empty header row
  if (headers.every((h) => h === "")) {
    ifValidationErrors.push({
      description: "Header row appears to be empty",
    });
    return;
  }

  const missingHeaders = expectedHeaders.filter(
    (h) => !headers.includes(h.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    ifValidationErrors.push({
      description: `Missing required headers: ${missingHeaders.join(", ")}`,
    });
  }

  // Check for duplicate headers
  const duplicateHeaders = headers.filter(
    (header, index) => header !== "" && headers.indexOf(header) !== index
  );

  if (duplicateHeaders.length > 0) {
    ifValidationErrors.push({
      description: `Duplicate headers found: ${duplicateHeaders.join(", ")}`,
    });
  }
};

// Helper function to validate dd-mm-yyyy date format
const isValidDateFormat = (dateString: string): boolean => {
  if (!dateString || dateString.trim() === "") return true; // Empty dates are allowed

  const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateString.match(dateRegex);

  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  // Basic range checks
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  // Create date object and check if it's valid
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// Helper function to check if a value is a valid number
const isValidNumber = (value: string): boolean => {
  if (!value || value.trim() === "") return true; // Empty numbers are allowed
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};

const validateRow = (
  data: string[][],
  ifValidationErrors: ifValidationError[],
  hasMissingValues: boolean,
  templateType?: string
) => {
  if (data.length === 0) return;

  const headers = data[0].map((h) =>
    String(h || "")
      .trim()
      .toLowerCase()
  );
  const dataRows = data.slice(1);
  const requiredFields = getRequiredFields(templateType);

  dataRows.forEach((row, index) => {
    // Convert all row values to strings and trim them
    const cleanRow = row.map((cell) => String(cell || "").trim());

    if (cleanRow.length !== headers.length) {
      ifValidationErrors.push({
        description: `Row ${index + 2} has ${
          cleanRow.length
        } columns, expected ${headers.length}`,
        row: index + 2,
      });
      return;
    }

    // Skip completely empty rows
    if (cleanRow.every((cell) => cell === "")) {
      return;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowObj[header] = cleanRow[i] || "";
    });

    // Check required fields based on template type
    requiredFields.forEach((field) => {
      const fieldValue = rowObj[field.toLowerCase()];
      if (!fieldValue || fieldValue.trim() === "") {
        hasMissingValues = true;
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' is required`,
          row: index + 2,
          column: headers.indexOf(field.toLowerCase()) + 1,
          currentValue: fieldValue,
        });
      }
    });

    // Template-specific validations
    if (templateType === "debtors") {
      // Validate numeric fields for Debtors
      const numericFields = [
        "amount_in_local_currency",
        "amount_in_doc_curr",
        "gl_account",
      ];
      numericFields.forEach((numField) => {
        const value = rowObj[numField];
        if (value && value !== "" && !isValidNumber(value.replace(/,/g, ""))) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate date fields for Debtors (dd-mm-yyyy format)
      const dateFields = ["net_due_date", "document_date", "posting_date"];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate currency codes for Debtors (should be 3 characters)
      const currencyFields = ["document_currency", "currency_2"];
      currencyFields.forEach((currencyField) => {
        const value = rowObj[currencyField];
        if (value && value !== "" && value.length !== 3) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${currencyField}' must be a 3-character currency code (e.g., USD, EUR, INR)`,
            row: index + 2,
            column: headers.indexOf(currencyField) + 1,
            currentValue: value,
          });
        }
      });

      // // Validate company code format for Debtors
      // const companyCode = rowObj["company_code"];
      // if (companyCode && companyCode.length !== 4) {
      //   ifValidationErrors.push({
      //     description: `Row ${
      //       index + 2
      //     }: 'company_code' should be 4 characters`,
      //     row: index + 2,
      //     column: headers.indexOf("company_code") + 1,
      //     currentValue: companyCode,
      //   });
      // }

      // Validate document type for Debtors
      // const validDocTypes = ["dr", "dz", "dg", "dn", "invoice", "credit_memo", "payment"];
      // const docType = rowObj["document_type"];
      // if (docType && !validDocTypes.includes(docType.toLowerCase())) {
      //   ifValidationErrors.push({
      //     description: `Row ${index + 2}: 'document_type' must be one of: ${validDocTypes.join(", ").toUpperCase()}`,
      //     row: index + 2,
      //     column: headers.indexOf("document_type") + 1,
      //     currentValue: docType
      //   });
      // }

      // Validate special G/L indicator (should be valid values)
      const validSpecialGLInds = [
        "a",
        "b",
        "c",
        "d",
        "f",
        "k",
        "p",
        "v",
        "w",
        "",
      ];
      const specialGLInd = rowObj["special_gl_ind"];
      if (
        specialGLInd &&
        !validSpecialGLInds.includes(specialGLInd.toLowerCase())
      ) {
        ifValidationErrors.push({
          description: `Row ${
            index + 2
          }: 'special_gl_ind' must be one of: ${validSpecialGLInds
            .filter((x) => x !== "")
            .join(", ")
            .toUpperCase()} or empty`,
          row: index + 2,
          column: headers.indexOf("special_gl_ind") + 1,
          currentValue: specialGLInd,
        });
      }

      // Validate customer code format (should not be empty if provided)
      const customer = rowObj["customer"];
      if (customer && customer.trim() === "") {
        ifValidationErrors.push({
          description: `Row ${
            index + 2
          }: 'customer' should not be empty when provided`,
          row: index + 2,
          column: headers.indexOf("customer") + 1,
          currentValue: customer,
        });
      }

      // Validate reference format (should be alphanumeric)
      // const reference = rowObj["reference"];
      // if (reference && !/^[a-zA-Z0-9_-]*$/.test(reference)) {
      //   ifValidationErrors.push({
      //     description: `Row ${
      //       index + 2
      //     }: 'reference' should contain only alphanumeric characters, hyphens, and underscores`,
      //     row: index + 2,
      //     column: headers.indexOf("reference") + 1,
      //     currentValue: reference,
      //   });
      // }
    } else if (templateType === "creditor") {
      // Validate numeric fields for Creditor
      const numericFields = [
        // "account",
        "gl_account",
        "posting_key",
        "amount_in_doc_curr",
      ];
      numericFields.forEach((numField) => {
        const value = rowObj[numField];
        if (value && value !== "" && !isValidNumber(value.replace(/,/g, ""))) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate date fields for Creditor (dd-mm-yyyy format)
      const dateFields = ["document_date", "net_due_date", "posting_date"];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate currency codes for Creditor (should be 3 characters)
      const currencyFields = [
        "document_currency",
        "local_currency",
        "currency_2",
      ];
      currencyFields.forEach((currencyField) => {
        const value = rowObj[currencyField];
        if (value && value !== "" && value.length !== 3) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${currencyField}' must be a 3-character currency code (e.g., USD, EUR, INR)`,
            row: index + 2,
            column: headers.indexOf(currencyField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate company code format for Creditor
      // const companyCode = rowObj["company_code"];
      // if (companyCode && companyCode.length !== 4) {
      //   ifValidationErrors.push({
      //     description: `Row ${
      //       index + 2
      //     }: 'company_code' should be 4 characters`,
      //     row: index + 2,
      //     column: headers.indexOf("company_code") + 1,
      //     currentValue: companyCode,
      //   });
      // }

      // Validate payment block (Y/N)
      // const paymentBlock = rowObj["payment_block"];
      // if (
      //   paymentBlock &&
      //   !["y", "n", "yes", "no", ""].includes(paymentBlock.toLowerCase())
      // ) {
      //   ifValidationErrors.push({
      //     description: `Row ${index + 2}: 'payment_block' must be 'Y' or 'N'`,
      //     row: index + 2,
      //     column: headers.indexOf("payment_block") + 1,
      //     currentValue: paymentBlock,
      //   });
      // }

      // // Validate document type for Creditor
      // const validDocTypes = ["kr", "kz", "kg", "kn", "invoice", "credit_memo"];
      // const docType = rowObj["document_type"];
      // if (docType && !validDocTypes.includes(docType.toLowerCase())) {
      //   ifValidationErrors.push({
      //     description: `Row ${index + 2}: 'document_type' must be one of: ${validDocTypes.join(", ").toUpperCase()}`,
      //     row: index + 2,
      //     column: headers.indexOf("document_type") + 1,
      //     currentValue: docType
      //   });
      // }

      // Validate posting key (should be 2 digits)
      const postingKey = rowObj["posting_key"];
      if (
        postingKey &&
        (postingKey.length !== 2 || !/^\d{2}$/.test(postingKey))
      ) {
        ifValidationErrors.push({
          description: `Row ${
            index + 2
          }: 'posting_key' must be a 2-digit number (e.g., 31, 40)`,
          row: index + 2,
          column: headers.indexOf("posting_key") + 1,
          currentValue: postingKey,
        });
      }
    } else if (templateType === "po") {
      // Validate LC indicator field (Y/N) for PO template
      const lcIndicator = rowObj["lc_indicator"];
      if (
        lcIndicator &&
        !["y", "n", "yes", "no"].includes(lcIndicator.toLowerCase())
      ) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'lc_indicator' must be 'Y' or 'N'`,
          row: index + 2,
          column: headers.indexOf("lc_indicator") + 1,
          currentValue: lcIndicator,
        });
      }

      // Validate numeric fields for PO
      const numericFields = [
        "uom_quantity",
        "net_price",
        "net_value",
        "exchange_rate",
        "payment_to_vendor",
      ];
      numericFields.forEach((numField) => {
        const value = rowObj[numField];
        if (value && value !== "" && !isValidNumber(value)) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate date fields for PO (dd-mm-yyyy format)
      const dateFields = [
        "contract_date",
        "reference_date",
        "exchange_rate_date",
      ];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value,
          });
        }
      });
    } else if (templateType === "lc") {
      // Validate amount field for LC
      const amount = rowObj["amount"];
      if (amount && amount !== "" && !isValidNumber(amount)) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'amount' must be a valid number`,
          row: index + 2,
          column: headers.indexOf("amount") + 1,
          currentValue: amount,
        });
      }

      // Validate date fields for LC (dd-mm-yyyy format)
      const dateFields = ["issue_date", "expiry_date"];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate LC type
      const validLcTypes = [
        "commercial",
        "standby",
        "documentary",
        "revolving",
      ];
      const lcType = rowObj["lc_type"];
      if (lcType && !validLcTypes.includes(lcType.toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${
            index + 2
          }: 'lc_type' must be one of: ${validLcTypes
            .join(", ")
            .toUpperCase()}`,
          row: index + 2,
          column: headers.indexOf("lc_type") + 1,
          currentValue: lcType,
        });
      }

      // Validate system LC number format (should start with LC)
      const systemLcNumber = rowObj["system_lc_number"];
      if (systemLcNumber && !systemLcNumber.toLowerCase().startsWith("lc")) {
        ifValidationErrors.push({
          description: `Row ${
            index + 2
          }: 'system_lc_number' should start with 'LC'`,
          row: index + 2,
          column: headers.indexOf("system_lc_number") + 1,
          currentValue: systemLcNumber,
        });
      }
    } else if (templateType === "so") {
      // Validate LC indicator field (Y/N) for SO template
      const lcIndicator = rowObj["lc_indicator"];
      if (
        lcIndicator &&
        !["y", "n", "yes", "no"].includes(lcIndicator.toLowerCase())
      ) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'lc_indicator' must be 'Y' or 'N'`,
          row: index + 2,
          column: headers.indexOf("lc_indicator") + 1,
          currentValue: lcIndicator,
        });
      }

      // Validate document type for SO
      const validDocTypes = ["so", "sales order", "sales_order"];
      const docType = rowObj["document_type"];
      if (docType && !validDocTypes.includes(docType.toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${
            index + 2
          }: 'document_type' should be 'SO' for Sales Order template`,
          row: index + 2,
          column: headers.indexOf("document_type") + 1,
          currentValue: docType,
        });
      }

      // Validate date fields for SO (dd-mm-yyyy format)
      const dateFields = ["contract_date", "reference_date", "delivery_date"];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate numeric fields for SO
      const numericFields = [
        "uom_quantity",
        "net_price",
        "net_value",
        "total_invoice_value",
      ];
      numericFields.forEach((numField) => {
        const value = rowObj[numField];
        if (value && value !== "" && !isValidNumber(value)) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate inco terms for SO
      const validIncoTerms = [
        "fob",
        "cif",
        "cfr",
        "exw",
        "ddp",
        "dap",
        "fca",
        "cpt",
        "cip",
      ];
      const incoTerms = rowObj["inco_terms"];
      if (incoTerms && !validIncoTerms.includes(incoTerms.toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${
            index + 2
          }: 'inco_terms' must be one of: ${validIncoTerms
            .join(", ")
            .toUpperCase()}`,
          row: index + 2,
          column: headers.indexOf("inco_terms") + 1,
          currentValue: incoTerms,
        });
      }
    } else if (templateType === "grn") {
      // Validate numeric fields for GRN
      const numericFields = [
        "account",
        "amount_in_doc_curr",
        "amount_in_local_currency",
      ];
      numericFields.forEach((numField) => {
        const value = rowObj[numField];
        if (value && value !== "" && !isValidNumber(value.replace(/,/g, ""))) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate date fields for GRN (dd-mm-yyyy format)
      const dateFields = ["document_date", "posting_date", "clearing_date"];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate currency codes for GRN (should be 3 characters)
      const currencyFields = ["document_currency", "currency_2"];
      currencyFields.forEach((currencyField) => {
        const value = rowObj[currencyField];
        if (value && value !== "" && value.length !== 3) {
          ifValidationErrors.push({
            description: `Row ${
              index + 2
            }: '${currencyField}' must be a 3-character currency code (e.g., USD, EUR, INR)`,
            row: index + 2,
            column: headers.indexOf(currencyField) + 1,
            currentValue: value,
          });
        }
      });

      // Validate company code format for GRN
      // const companyCode = rowObj["company_code"];
      // if (companyCode && companyCode.length !== 4) {
      //   ifValidationErrors.push({
      //     description: `Row ${
      //       index + 2
      //     }: 'company_code' should be 4 characters`,
      //     row: index + 2,
      //     column: headers.indexOf("company_code") + 1,
      //     currentValue: companyCode,
      //   });
      // }
    }

    // Common validations for all templates
    // Validate currency code (should be 3 characters)
    const currencyCode =
      rowObj["currency_code"] ||
      rowObj["currency"] ||
      rowObj["document_currency"];
    if (currencyCode && currencyCode.length !== 3) {
      const fieldName = rowObj["currency_code"]
        ? "currency_code"
        : rowObj["currency"]
        ? "currency"
        : "document_currency";
      ifValidationErrors.push({
        description: `Row ${
          index + 2
        }: '${fieldName}' must be a 3-character currency code (e.g., USD, EUR, INR)`,
        row: index + 2,
        column: headers.indexOf(fieldName) + 1,
        currentValue: currencyCode,
      });
    }
  });
};

interface ifDataToRender {
  status: "success" | "error";
  validationErrors: ifValidationError[];
  hasHeaders: boolean;
  hasMissingValues: boolean;
  rowCount: number;
  columnCount: number;
  error?: string;
}

export const validateFileContent = (
  file: File,
  templateType?: string
): Promise<Partial<UploadedFile>> => {
  return new Promise((resolve) => {
    const validationErrors: ifValidationError[] = [];
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

        validateColumns(data, validationErrors, templateType);
        validateRow(data, validationErrors, hasMissingValues, templateType);

        const status = validationErrors.length > 0 ? "error" : "success";

        // Set the actual row and column counts from parsed data
        rowCount = data.length > 0 ? data.length - 1 : 0; // Subtract 1 for header
        columnCount = data.length > 0 ? data[0].length : 0;
        hasHeaders = data.length > 0;

        // Only create description string if there are errors
        const errorDescription =
          validationErrors.length > 0
            ? validationErrors.map((e) => e.description).join(", ")
            : undefined;

        const result = {
          status: status,
          validationErrors: validationErrors.length > 0 ? validationErrors : [],
          hasHeaders,
          hasMissingValues,
          rowCount,
          columnCount,
          error: errorDescription,
        };

        console.log("Validation result:", result);
        resolve(result as Partial<UploadedFile>);
      } catch (error) {
        console.error("Processing error:", error);
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
        console.error("Error parsing file:", error);
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

    // Read file based on type
    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

// Keep your existing utility functions
export const validateFileSize = (size: number) => {
  return size < MAX_FILE_SIZE ? true : false;
};

export const getFileStatusColor = (file: UploadedFile) => {
  if (
    file.status === "error" ||
    (file.validationErrors && file.validationErrors.length > 0)
  ) {
    return "bg-red-50 border-red-200";
  }
  if (file.status === "success") {
    return "bg-green-50 border-green-200";
  }
  return "bg-gray-50 border-gray-200";
};

export const formatFileSize = (size: number) => {
  return size < 1024
    ? `${size} B`
    : size < 1024 * 1024
    ? `${(size / 1024).toFixed(2)} KB`
    : `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

export const getFileTextColor = (file: UploadedFile) => {
  if (
    file.status === "error" ||
    (file.validationErrors && file.validationErrors.length > 0)
  ) {
    return "text-red-900";
  }
  if (file.status === "success") {
    return "text-green-900";
  }
  return "text-gray-900";
};

export const validatePreviewData = (
  data: string[][],
  previewHeaders: string[],
  templateType?: string
) => {
  const validationErrors: Array<{
    description: string;
    row?: number;
    column?: number;
    currentValue?: string;
  }> = [];
  const requiredFields = getRequiredFields(templateType);

  // Check for header validation
  const hasMissingHeaders = previewHeaders.some((h) => !h.trim());
  if (hasMissingHeaders) {
    validationErrors.push({
      description: "Some headers are missing",
    });
  }

  // Check data validation
  data.forEach((row, rowIndex) => {
    // Create row object for easier validation
    const rowObj: Record<string, string> = {};
    previewHeaders.forEach((header, i) => {
      rowObj[header.toLowerCase()] = (row[i] || "").toString().trim();
    });

    previewHeaders.forEach((header, colIndex) => {
      const value = row[colIndex] || "";

      // Basic required field checks based on template type
      if (!value.trim() && requiredFields.includes(header)) {
        validationErrors.push({
          description: `${header} is required`,
          row: rowIndex + 1,
          column: colIndex + 1,
          currentValue: value,
        });
      }

      // Template-specific validations
      if (templateType === "debtors") {
        // Number validation for Debtors
        const numericFields = [
          "amount_in_local_currency",
          "amount_in_doc_curr",
          "gl_account",
        ];
        if (
          numericFields.includes(header) &&
          value &&
          isNaN(Number(value.replace(/,/g, "")))
        ) {
          validationErrors.push({
            description: `${header} must be a number`,
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value,
          });
        }

        // Date validation for Debtors (dd-mm-yyyy format)
        const dateFields = ["net_due_date", "document_date", "posting_date"];
        if (dateFields.includes(header) && value) {
          if (!isValidDateFormat(value)) {
            validationErrors.push({
              description: `${header} must be valid date in DD-MM-YYYY format`,
              row: rowIndex + 1,
              column: colIndex + 1,
              currentValue: value,
            });
          }
        }

        // Currency validation for Debtors
        const currencyFields = ["document_currency", "currency_2"];
        if (currencyFields.includes(header) && value && value.length !== 3) {
          validationErrors.push({
            description: `${header} must be 3 characters`,
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value,
          });
        }

        // // Company code validation for Debtors
        // if (header === "company_code" && value && value.length !== 4) {
        //   validationErrors.push({
        //     description: "company_code should be 4 characters",
        //     row: rowIndex + 1,
        //     column: colIndex + 1,
        //     currentValue: value,
        //   });
        // }

        // // Document type validation for Debtors
        // const validDocTypes = ["dr", "dz", "dg", "dn", "invoice", "credit_memo", "payment"];
        // if (header === "document_type" && value && !validDocTypes.includes(value.toLowerCase())) {
        //   validationErrors.push({
        //     description: `document_type must be one of: ${validDocTypes.join(", ").toUpperCase()}`,
        //     row: rowIndex + 1,
        //     column: colIndex + 1,
        //     currentValue: value
        //   });
        // }

        // Special G/L indicator validation
        const validSpecialGLInds = [
          "a",
          "b",
          "c",
          "d",
          "f",
          "k",
          "p",
          "v",
          "w",
          "",
        ];
        if (
          header === "special_gl_ind" &&
          value &&
          !validSpecialGLInds.includes(value.toLowerCase())
        ) {
          validationErrors.push({
            description: `special_gl_ind must be one of: ${validSpecialGLInds
              .filter((x) => x !== "")
              .join(", ")
              .toUpperCase()} or empty`,
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value,
          });
        }

        // Reference validation
        if (
          header === "reference" &&
          value &&
          !/^[a-zA-Z0-9_-]*$/.test(value)
        ) {
          validationErrors.push({
            description:
              "reference should contain only alphanumeric characters, hyphens, and underscores",
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value,
          });
        }
      } else if (templateType === "creditor") {
        // ...existing creditor validations...
      } else if (templateType === "po") {
        // ...existing PO validations...
      } else if (templateType === "lc") {
        // ...existing LC validations...
      } else if (templateType === "so") {
        // ...existing SO validations...
      } else if (templateType === "grn") {
        // ...existing GRN validations...
      }

      // Common validations for all templates
      // Currency code validation
      if (
        (header === "currency_code" ||
          header === "currency" ||
          header === "document_currency") &&
        value &&
        value.length !== 3
      ) {
        validationErrors.push({
          description: "currency must be 3 characters",
          row: rowIndex + 1,
          column: colIndex + 1,
          currentValue: value,
        });
      }
    });
  });

  return validationErrors;
};

import * as XLSX from "xlsx";

export const handleDownload = (template: any) => {
  // Get headers based on template type
  const expectedHeaders = getExpectedHeaders(template.id);

  let sampleRow: string[];

  if (template.id === "po") {
    sampleRow = [
      "COMP001",
      "CA01",
      "ENT01",
      "ENT1_001",
      "ENT2_001",
      "DOC001",
      "Y",
      "2024",
      "15-01-2024",
      "REF001",
      "10-01-2024",
      "VEN001",
      "Vendor ABC Ltd",
      "CIF",
      "USD",
      "NET30",
      "FOB",
      "Mumbai Port",
      "1000000",
      "PCS",
      "100",
      "50.00",
      "5000.00",
      "1.0",
      "15-01-2024",
      "DOC_001",
      "CC001",
      "ENT3_001",
    ];
  } else if (template.id === "lc") {
    sampleRow = [
      "LC001",
      "BANK001",
      "REF001",
      "COMMERCIAL",
      "ABC Company Ltd",
      "XYZ Supplier Inc",
      "Standard Bank",
      "USD",
      "100000",
      "15-01-2024",
      "15-06-2024",
      "PO001",
    ];
  } else if (template.id === "so") {
    sampleRow = [
      "COMP001",
      "CA01",
      "ENT01",
      "ENT1_001",
      "ENT2_001",
      "ENT3_001",
      "DOC001",
      "SO",
      "15-01-2024",
      "REF001",
      "10-01-2024",
      "CUST001",
      "Customer ABC Ltd",
      "USD",
      "CIF",
      "NET30",
      "FOB",
      "1000000",
      "LOT001",
      "Steel Products",
      "PCS",
      "100",
      "50.00",
      "5000.00",
      "Quality products",
      "15-02-2024",
      "Y",
      "FIXED",
      "CC001",
    ];
  } else if (template.id === "creditor") {
    sampleRow = [
      "N", // payment_block
      "7000", // company_code
      "CHEN", // business_area
      "2000001", // account
      "PAN123456789", // pann
      "400000", // gl_account
      "15-01-2024", // document_date
      "30-01-2024", // net_due_date
      "15-01-2024", // posting_date
      "KR", // document_type
      "31", // posting_key
      "100000.00", // amount_in_doc_curr
      "USD", // document_currency
      "USD", // local_currency
      "USD", // currency_2
      "BANKREF123", // bank_reference
    ];
  } else if (template.id === "debtors") {
    sampleRow = [
      "REF001", // reference
      "7000", // company_code
      "ASSIGN001", // assignment
      "7050000252", // document_number
      "30-01-2024", // net_due_date
      "DR", // document_type
      "15-01-2024", // document_date
      "15-01-2024", // posting_date
      "A", // special_gl_ind
      "150000.00", // amount_in_local_currency
      "150000.00", // amount_in_doc_curr
      "USD", // document_currency
      "Customer payment received", // text
      "CUST001", // customer
      "CLEAR001", // clearing_document
      "130000", // gl_account
      "USD", // currency_2
      "ABC Company Ltd", // company
      "BANKREF456", // bank_reference
    ];
  } else {
    // grn template
    sampleRow = [
      "1000",
      "COMP001",
      "BA01",
      "GR",
      "CUST001",
      "ASSIGN001",
      "DOC001",
      "15-01-2024",
      "15-01-2024",
      "VEN001",
      "REF001",
      "1000",
      "USD",
      "750000",
      "Goods Receipt",
      "CLEAR001",
      "15-01-2024",
      "S",
      "1000",
      "USD",
      "COMP001",
    ];
  }

  const worksheetData = [expectedHeaders, sampleRow];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const fileName = template?.name ? `${template.name}.xlsx` : "Template.xlsx";
  XLSX.writeFile(workbook, fileName);
};

// export const handleDownload = (template: any) => {
//   // Get headers based on template type
//   const expectedHeaders = getExpectedHeaders(template.id);
//   const headers = expectedHeaders.join(",");

//   let sampleRow: string[];

//   if (template.id === "po") {
//     sampleRow = [
//       "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "DOC001", "Y", "2024",
//       "15-01-2024", "REF001", "10-01-2024", "VEN001", "Vendor ABC Ltd", "CIF", "USD",
//       "NET30", "FOB", "Mumbai Port", "1000000", "PCS", "100", "50.00", "5000.00",
//       "1.0", "15-01-2024", "DOC_001", "CC001", "ENT3_001"
//     ];
//   } else if (template.id === "lc") {
//     sampleRow = [
//       "LC001", "BANK001", "REF001", "COMMERCIAL", "ABC Company Ltd",
//       "XYZ Supplier Inc", "Standard Bank", "USD", "100000",
//       "15-01-2024", "15-06-2024", "PO001"
//     ];
//   } else { // so template
//     sampleRow = [
//       "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "ENT3_001", "DOC001", "SO",
//       "15-01-2024", "REF001", "10-01-2024", "CUST001", "Customer ABC Ltd", "USD",
//       "CIF", "NET30", "FOB", "1000000", "LOT001", "Steel Products", "PCS", "100",
//       "50.00", "5000.00", "Quality products", "15-02-2024", "Y", "FIXED", "CC001"
//     ];
//   }

//   const csvContent = headers + "\n" + sampleRow.join(",");

//   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.setAttribute("download", template?.name ? `${template.name}.csv` : "Template.csv");
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
//   URL.revokeObjectURL(url);
// };
