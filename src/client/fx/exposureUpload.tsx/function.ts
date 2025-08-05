
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
];

// Headers for each template type
const poHeaders = [
  "company_code",
  "controlling_area", 
  "entity",
  "entity1",
  "entity2",
  "entity3",
  "document_no",
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
  "profit_cost_center"
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
  "linked_po_so_number"
];

const soHeaders = [
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
  "profit_cost_center"
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

const parseExcel = (arrayBuffer: ArrayBuffer, templateType?: string): string[][] => {
  // This is a simplified Excel parser - in a real app you'd use a proper library
  
  if (templateType === "po") {
    return [
      poHeaders,
      [
        "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "ENT3_001", "DOC001", 
        "2024-01-15", "REF001", "2024-01-10", "CUST001", "Customer ABC Ltd", "USD",
        "CIF", "NET30", "FOB", "1000000", "LOT001", "Steel Products", "PCS", "100",
        "50.00", "5000.00", "Quality products", "2024-02-15", "Y", "FIXED", "CC001"
      ],
      [
        "COMP002", "CA02", "ENT02", "ENT1_002", "ENT2_002", "ENT3_002", "DOC002",
        "2024-02-20", "REF002", "2024-02-15", "CUST002", "Customer XYZ Corp", "EUR", 
        "FOB", "NET45", "CIF", "2000000", "LOT002", "Electronic Components", "KG", "500",
        "25.50", "12750.00", "Electronic items", "2024-03-20", "N", "FLOATING", "CC002"
      ]
    ];
  } else if (templateType === "lc") {
    return [
      lcHeaders,
      [
        "LC001", "BANK001", "REF001", "COMMERCIAL", "ABC Company Ltd", 
        "XYZ Supplier Inc", "Standard Bank", "USD", "100000", 
        "2024-01-15", "2024-06-15", "PO001"
      ],
      [
        "LC002", "BANK002", "REF002", "STANDBY", "DEF Corporation", 
        "PQR Vendors Ltd", "Global Bank", "EUR", "250000",
        "2024-02-01", "2024-07-01", "PO002"  
      ]
    ];
  } else if (templateType === "so") {
    return [
      soHeaders,
      [
        "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "DOC001", "Y", "2024",
        "2024-01-15", "REF001", "2024-01-10", "VEN001", "Vendor ABC Ltd", "CIF", "USD",
        "NET30", "FOB", "Mumbai Port", "1000000", "PCS", "100", "50.00", "5000.00",
        "1.0", "2024-01-15", "DOC_001", "CC001"
      ],
      [
        "COMP002", "CA02", "ENT02", "ENT1_002", "ENT2_002", "DOC002", "N", "2024", 
        "2024-02-20", "REF002", "2024-02-15", "VEN002", "Supplier XYZ Corp", "FOB", "EUR",
        "NET45", "CIF", "Chennai Port", "2000000", "KG", "500", "25.50", "12750.00",
        "0.85", "2024-02-20", "DOC_002", "CC002"
      ]
    ];
  }
  
  // Default to SO template if no type specified
  return [
    soHeaders,
    [
      "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "DOC001", "Y", "2024",
      "2024-01-15", "REF001", "2024-01-10", "VEN001", "Vendor ABC Ltd", "CIF", "USD",
      "NET30", "FOB", "Mumbai Port", "1000000", "PCS", "100", "50.00", "5000.00", 
      "1.0", "2024-01-15", "DOC_001", "CC001"
    ]
  ];
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
        "customer_code",
        "customer_name",
        "currency_code"
      ];
    case "lc":
      return [
        "system_lc_number",
        "applicant_name", 
        "beneficiary_name",
        "issuing_bank",
        "currency",
        "amount"
      ];
    case "so":
      return [
        "company_code",
        "controlling_area",
        "entity",
        "document_no", 
        "reference_no",
        "vendor_code",
        "vendor_name",
        "currency_code"
      ];
    default:
      return [
        "company_code",
        "controlling_area", 
        "entity",
        "document_no",
        "reference_no", 
        "vendor_code",
        "vendor_name",
        "currency_code"
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
  let rowCount = 0;
  let columnCount = 0;
  let hasHeaders = false;

  const headers = data[0].map((h) => h.trim().toLowerCase());
  columnCount = headers.length;
  hasHeaders = true;
  rowCount = data.length - 1;

  const expectedHeaders = getExpectedHeaders(templateType);
  
  const missingHeaders = expectedHeaders.filter(
    (h) => !headers.includes(h.toLowerCase())
  );
  if (missingHeaders.length > 0) {
    ifValidationErrors.push({
      description: `Missing required headers: ${missingHeaders.join(", ")}`
    });
  }

  // Check for extra headers
  const extraHeaders = headers.filter(
    (h) => !expectedHeaders.map(eh => eh.toLowerCase()).includes(h.toLowerCase())
  );
  if (extraHeaders.length > 0) {
    ifValidationErrors.push({
      description: `Unexpected headers found: ${extraHeaders.join(", ")}`
    });
  }
};

const validateRow = (
  data: string[][],
  ifValidationErrors: ifValidationError[],
  hasMissingValues: boolean,
  templateType?: string
) => {
  const headers = data[0].map((h) => h.trim().toLowerCase());
  const dataRows = data.slice(1);
  const requiredFields = getRequiredFields(templateType);
  
  dataRows.forEach((row, index) => {
    if (row.length !== headers.length) {
      ifValidationErrors.push({
        description: `Row ${index + 2} has ${row.length} columns, expected ${headers.length}`,
        row: index + 2,
      });
      return;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowObj[header] = (row[i] || "").trim();
    });

    // Check required fields based on template type
    requiredFields.forEach((field) => {
      if (!rowObj[field]) {
        hasMissingValues = true;
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' is required`,
          row: index + 2,
          column: headers.indexOf(field) + 1,
          currentValue: rowObj[field]
        });
      }
    });

    // Template-specific validations
    if (templateType === "po") {
      // Validate LC indicator field (Y/N) for PO template
      if (rowObj["lc_indicator"] && 
          !["y", "n", "yes", "no"].includes(rowObj["lc_indicator"].toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'lc_indicator' must be 'Y' or 'N'`,
          row: index + 2,
          column: headers.indexOf("lc_indicator") + 1,
          currentValue: rowObj["lc_indicator"]
        });
      }

      // Validate numeric fields for PO
      const numericFields = ["uom_quantity", "net_price", "net_value", "total_invoice_value"];
      numericFields.forEach((numField) => {
        if (rowObj[numField] && 
            rowObj[numField] !== "" && 
            isNaN(Number(rowObj[numField]))) {
          ifValidationErrors.push({
            description: `Row ${index + 2}: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: rowObj[numField]
          });
        }
      });

      // Validate date fields for PO
      const dateFields = ["contract_date", "reference_date", "delivery_date"];
      dateFields.forEach((dateField) => {
        if (rowObj[dateField] && rowObj[dateField] !== "") {
          const date = new Date(rowObj[dateField]);
          if (isNaN(date.getTime())) {
            ifValidationErrors.push({
              description: `Row ${index + 2}: '${dateField}' must be a valid date (YYYY-MM-DD format)`,
              row: index + 2,
              column: headers.indexOf(dateField) + 1,
              currentValue: rowObj[dateField]
            });
          }
        }
      });

    } else if (templateType === "lc") {
      // Validate amount field for LC
      if (rowObj["amount"] && 
          rowObj["amount"] !== "" && 
          isNaN(Number(rowObj["amount"]))) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'amount' must be a valid number`,
          row: index + 2,
          column: headers.indexOf("amount") + 1,
          currentValue: rowObj["amount"]
        });
      }

      // Validate date fields for LC
      const dateFields = ["issue_date", "expiry_date"];
      dateFields.forEach((dateField) => {
        if (rowObj[dateField] && rowObj[dateField] !== "") {
          const date = new Date(rowObj[dateField]);
          if (isNaN(date.getTime())) {
            ifValidationErrors.push({
              description: `Row ${index + 2}: '${dateField}' must be a valid date (YYYY-MM-DD format)`,
              row: index + 2,
              column: headers.indexOf(dateField) + 1,
              currentValue: rowObj[dateField]
            });
          }
        }
      });

      // Validate LC type
      const validLcTypes = ["commercial", "standby", "documentary", "revolving"];
      if (rowObj["lc_type"] && 
          !validLcTypes.includes(rowObj["lc_type"].toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'lc_type' must be one of: ${validLcTypes.join(", ").toUpperCase()}`,
          row: index + 2,
          column: headers.indexOf("lc_type") + 1,
          currentValue: rowObj["lc_type"]
        });
      }

      // Validate system LC number format (should start with LC)
      if (rowObj["system_lc_number"] && 
          !rowObj["system_lc_number"].toLowerCase().startsWith("lc")) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'system_lc_number' should start with 'LC'`,
          row: index + 2,
          column: headers.indexOf("system_lc_number") + 1,
          currentValue: rowObj["system_lc_number"]
        });
      }

    } else if (templateType === "so") {
      // Validate LC indicator field (Y/N) for SO template  
      if (rowObj["lc_indicator"] && 
          !["y", "n", "yes", "no"].includes(rowObj["lc_indicator"].toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'lc_indicator' must be 'Y' or 'N'`,
          row: index + 2,
          column: headers.indexOf("lc_indicator") + 1,
          currentValue: rowObj["lc_indicator"]
        });
      }

      // Validate year field for SO (should be 4 digits)
      if (rowObj["lc_year"] && rowObj["lc_year"] !== "") {
        const year = parseInt(rowObj["lc_year"]);
        if (isNaN(year) || year < 1900 || year > 2100) {
          ifValidationErrors.push({
            description: `Row ${index + 2}: 'lc_year' must be a valid 4-digit year`,
            row: index + 2,
            column: headers.indexOf("lc_year") + 1,
            currentValue: rowObj["lc_year"]
          });
        }
      }

      // Validate date fields for SO
      const dateFields = ["contract_date", "reference_date", "exchange_rate_date"];
      dateFields.forEach((dateField) => {
        if (rowObj[dateField] && rowObj[dateField] !== "") {
          const date = new Date(rowObj[dateField]);
          if (isNaN(date.getTime())) {
            ifValidationErrors.push({
              description: `Row ${index + 2}: '${dateField}' must be a valid date (YYYY-MM-DD format)`,
              row: index + 2,
              column: headers.indexOf(dateField) + 1,
              currentValue: rowObj[dateField]
            });
          }
        }
      });

      // Validate numeric fields for SO
      const numericFields = ["uom_quantity", "net_price", "net_value", "exchange_rate"];
      numericFields.forEach((numField) => {
        if (rowObj[numField] && 
            rowObj[numField] !== "" && 
            isNaN(Number(rowObj[numField]))) {
          ifValidationErrors.push({
            description: `Row ${index + 2}: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: rowObj[numField]
          });
        }
      });

      // Validate inco terms for SO
      const validIncoTerms = ["fob", "cif", "cfr", "exw", "ddp", "dap", "fca", "cpt", "cip"];
      if (rowObj["inco_terms"] && 
          !validIncoTerms.includes(rowObj["inco_terms"].toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'inco_terms' must be one of: ${validIncoTerms.join(", ").toUpperCase()}`,
          row: index + 2,
          column: headers.indexOf("inco_terms") + 1,
          currentValue: rowObj["inco_terms"]
        });
      }
    }

    // Common validations for all templates
    // Validate currency code (should be 3 characters) 
    if (rowObj["currency_code"] && 
        rowObj["currency_code"].length !== 3) {
      ifValidationErrors.push({
        description: `Row ${index + 2}: 'currency_code' must be a 3-character currency code (e.g., USD, EUR, INR)`,
        row: index + 2,
        column: headers.indexOf("currency_code") + 1,
        currentValue: rowObj["currency_code"]
      });
    }

    // Check for empty cells in required fields
    if (row.some((cell, cellIndex) => {
      const header = headers[cellIndex];
      const isRequiredField = requiredFields.includes(header);
      return isRequiredField && (!cell || cell.trim() === "");
    })) {
      hasMissingValues = true;
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

        const result: ifDataToRender = {
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
          parsedData = parseExcel(fileData as ArrayBuffer, templateType);
        } else {
          resolve({
            status: "error",
            validationErrors: [
              {
                description: "Unsupported file format. Only CSV and Excel files are supported.",
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
              description: "Failed to parse file. Please check the file format.",
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
  const validationErrors: string[] = [];
  const requiredFields = getRequiredFields(templateType);

  // Check for header validation
  const hasMissingHeaders = previewHeaders.some((h) => !h.trim());
  if (hasMissingHeaders) {
    validationErrors.push("Some headers are missing");
  }

  // Check data validation
  data.forEach((row, rowIndex) => {
    previewHeaders.forEach((header, colIndex) => {
      const value = row[colIndex] || "";

      // Basic required field checks based on template type
      if (!value.trim() && requiredFields.includes(header)) {
        validationErrors.push(`Row ${rowIndex + 1}: ${header} is required`);
      }

      // Template-specific validations
      if (templateType === "po") {
        // LC Indicator validation for PO
        if (header === "lc_indicator" && value && !["Y", "N", "y", "n"].includes(value)) {
          validationErrors.push(`Row ${rowIndex + 1}: lc_indicator must be Y or N`);
        }

        // Number validation for PO
        const numericFields = ["uom_quantity", "net_price", "net_value", "total_invoice_value"];
        if (numericFields.includes(header) && value && isNaN(Number(value))) {
          validationErrors.push(`Row ${rowIndex + 1}: ${header} must be a number`);
        }

        // Date validation for PO
        const dateFields = ["contract_date", "reference_date", "delivery_date"];
        if (dateFields.includes(header) && value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            validationErrors.push(`Row ${rowIndex + 1}: ${header} must be valid date`);
          }
        }

      } else if (templateType === "lc") {
        // Amount validation for LC
        if (header === "amount" && value && isNaN(Number(value))) {
          validationErrors.push(`Row ${rowIndex + 1}: ${header} must be a number`);
        }

        // LC type validation
        const validLcTypes = ["commercial", "standby", "documentary", "revolving"];
        if (header === "lc_type" && value && !validLcTypes.includes(value.toLowerCase())) {
          validationErrors.push(`Row ${rowIndex + 1}: lc_type must be one of: ${validLcTypes.join(", ").toUpperCase()}`);
        }

        // Date validation for LC
        const dateFields = ["issue_date", "expiry_date"];
        if (dateFields.includes(header) && value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            validationErrors.push(`Row ${rowIndex + 1}: ${header} must be valid date`);
          }
        }

        // System LC number validation
        if (header === "system_lc_number" && value && !value.toLowerCase().startsWith("lc")) {
          validationErrors.push(`Row ${rowIndex + 1}: system_lc_number should start with 'LC'`);
        }

      } else if (templateType === "so") {
        // LC Indicator validation for SO
        if (header === "lc_indicator" && value && !["Y", "N", "y", "n"].includes(value)) {
          validationErrors.push(`Row ${rowIndex + 1}: lc_indicator must be Y or N`);
        }

        // Year validation for SO
        if (header === "lc_year" && value) {
          const year = parseInt(value);
          if (isNaN(year) || year < 1900 || year > 2100) {
            validationErrors.push(`Row ${rowIndex + 1}: lc_year must be a valid 4-digit year`);
          }
        }

        // Number validation for SO
        const numericFields = ["uom_quantity", "net_price", "net_value", "exchange_rate"];
        if (numericFields.includes(header) && value && isNaN(Number(value))) {
          validationErrors.push(`Row ${rowIndex + 1}: ${header} must be a number`);
        }

        // Date validation for SO
        const dateFields = ["contract_date", "reference_date", "exchange_rate_date"];
        if (dateFields.includes(header) && value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            validationErrors.push(`Row ${rowIndex + 1}: ${header} must be valid date`);
          }
        }

        // Inco terms validation for SO
        const validIncoTerms = ["fob", "cif", "cfr", "exw", "ddp", "dap", "fca", "cpt", "cip"];
        if (header === "inco_terms" && value && !validIncoTerms.includes(value.toLowerCase())) {
          validationErrors.push(`Row ${rowIndex + 1}: inco_terms must be one of: ${validIncoTerms.join(", ").toUpperCase()}`);
        }
      }

      // Common validations for all templates
      // Currency code validation
      if (header === "currency_code" && value && value.length !== 3) {
        validationErrors.push(`Row ${rowIndex + 1}: currency_code must be 3 characters`);
      }
    });
  });

  return validationErrors;
};

export const handleDownload = (template: any) => {
  // Get headers based on template type
  const expectedHeaders = getExpectedHeaders(template.id);
  const headers = expectedHeaders.join(",");
  
  let sampleRow: string[];
  
  if (template.id === "po") {
    sampleRow = [
      "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "ENT3_001", "DOC001",
      "2024-01-15", "REF001", "2024-01-10", "CUST001", "Customer ABC Ltd", "USD",
      "CIF", "NET30", "FOB", "1000000", "LOT001", "Steel Products", "PCS", "100",
      "50.00", "5000.00", "Quality products", "2024-02-15", "Y", "FIXED", "CC001"
    ];
  } else if (template.id === "lc") {
    sampleRow = [
      "LC001", "BANK001", "REF001", "COMMERCIAL", "ABC Company Ltd",
      "XYZ Supplier Inc", "Standard Bank", "USD", "100000",
      "2024-01-15", "2024-06-15", "PO001"
    ];
  } else { // so template
    sampleRow = [
      "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "DOC001", "Y", "2024",
      "2024-01-15", "REF001", "2024-01-10", "VEN001", "Vendor ABC Ltd", "CIF",
      "USD", "NET30", "FOB", "Mumbai Port", "1000000", "PCS", "100", "50.00",
      "5000.00", "1.0", "2024-01-15", "DOC_001", "CC001"
    ];
  }

  const csvContent = headers + "\n" + sampleRow.join(",");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", template?.name ? `${template.name}.csv` : "Template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
