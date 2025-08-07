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
  "entity3"
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

const parseExcel = (arrayBuffer: ArrayBuffer): string[][] => {
  try {
    // Read the workbook from array buffer
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert worksheet to array of arrays
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Use array of arrays format
      defval: '', // Default value for empty cells
      raw: false // Convert all values to strings
    });
    
    // Filter out completely empty rows and convert all values to strings
    const filteredData = data
      .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
      .map(row => row.map(cell => String(cell || '').trim()));
    
    return filteredData;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file. Please ensure it\'s a valid Excel file.');
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
        "customer_code",
        "customer_name",
        "currency_code"
      ];
    default:
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
      description: "File appears to be empty or has no readable data"
    });
    return;
  }

  const headers = data[0].map((h) => String(h || '').trim().toLowerCase());
  const expectedHeaders = getExpectedHeaders(templateType);
  
  // Check for completely empty header row
  if (headers.every(h => h === '')) {
    ifValidationErrors.push({
      description: "Header row appears to be empty"
    });
    return;
  }
  
  const missingHeaders = expectedHeaders.filter(
    (h) => !headers.includes(h.toLowerCase())
  );
  
  if (missingHeaders.length > 0) {
    ifValidationErrors.push({
      description: `Missing required headers: ${missingHeaders.join(", ")}`
    });
  }

  // Check for duplicate headers
  const duplicateHeaders = headers.filter((header, index) => 
    header !== '' && headers.indexOf(header) !== index
  );
  
  if (duplicateHeaders.length > 0) {
    ifValidationErrors.push({
      description: `Duplicate headers found: ${duplicateHeaders.join(", ")}`
    });
  }
};

// Helper function to validate dd-mm-yyyy date format
const isValidDateFormat = (dateString: string): boolean => {
  if (!dateString || dateString.trim() === '') return true; // Empty dates are allowed
  
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
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};

// Helper function to check if a value is a valid number
const isValidNumber = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Empty numbers are allowed
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
  
  const headers = data[0].map((h) => String(h || '').trim().toLowerCase());
  const dataRows = data.slice(1);
  const requiredFields = getRequiredFields(templateType);
  
  dataRows.forEach((row, index) => {
    // Convert all row values to strings and trim them
    const cleanRow = row.map(cell => String(cell || '').trim());
    
    if (cleanRow.length !== headers.length) {
      ifValidationErrors.push({
        description: `Row ${index + 2} has ${cleanRow.length} columns, expected ${headers.length}`,
        row: index + 2,
      });
      return;
    }

    // Skip completely empty rows
    if (cleanRow.every(cell => cell === '')) {
      return;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowObj[header] = cleanRow[i] || '';
    });

    // Check required fields based on template type
    requiredFields.forEach((field) => {
      const fieldValue = rowObj[field.toLowerCase()];
      if (!fieldValue || fieldValue.trim() === '') {
        hasMissingValues = true;
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' is required`,
          row: index + 2,
          column: headers.indexOf(field.toLowerCase()) + 1,
          currentValue: fieldValue
        });
      }
    });

    // Template-specific validations
    if (templateType === "po") {
      // Validate LC indicator field (Y/N) for PO template
      const lcIndicator = rowObj["lc_indicator"];
      if (lcIndicator && !["y", "n", "yes", "no"].includes(lcIndicator.toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'lc_indicator' must be 'Y' or 'N'`,
          row: index + 2,
          column: headers.indexOf("lc_indicator") + 1,
          currentValue: lcIndicator
        });
      }

      // Validate numeric fields for PO
      const numericFields = ["uom_quantity", "net_price", "net_value", "exchange_rate", "payment_to_vendor"];
      numericFields.forEach((numField) => {
        const value = rowObj[numField];
        if (value && value !== "" && !isValidNumber(value)) {
          ifValidationErrors.push({
            description: `Row ${index + 2}: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: value
          });
        }
      });

      // Validate date fields for PO (dd-mm-yyyy format)
      const dateFields = ["contract_date", "reference_date", "exchange_rate_date"];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${index + 2}: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value
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
          currentValue: amount
        });
      }

      // Validate date fields for LC (dd-mm-yyyy format)
      const dateFields = ["issue_date", "expiry_date"];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${index + 2}: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value
          });
        }
      });

      // Validate LC type
      const validLcTypes = ["commercial", "standby", "documentary", "revolving"];
      const lcType = rowObj["lc_type"];
      if (lcType && !validLcTypes.includes(lcType.toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'lc_type' must be one of: ${validLcTypes.join(", ").toUpperCase()}`,
          row: index + 2,
          column: headers.indexOf("lc_type") + 1,
          currentValue: lcType
        });
      }

      // Validate system LC number format (should start with LC)
      const systemLcNumber = rowObj["system_lc_number"];
      if (systemLcNumber && !systemLcNumber.toLowerCase().startsWith("lc")) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'system_lc_number' should start with 'LC'`,
          row: index + 2,
          column: headers.indexOf("system_lc_number") + 1,
          currentValue: systemLcNumber
        });
      }

    } else if (templateType === "so") {
      // Validate LC indicator field (Y/N) for SO template  
      const lcIndicator = rowObj["lc_indicator"];
      if (lcIndicator && !["y", "n", "yes", "no"].includes(lcIndicator.toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'lc_indicator' must be 'Y' or 'N'`,
          row: index + 2,
          column: headers.indexOf("lc_indicator") + 1,
          currentValue: lcIndicator
        });
      }

      // Validate document type for SO
      const validDocTypes = ["so", "sales order", "sales_order"];
      const docType = rowObj["document_type"];
      if (docType && !validDocTypes.includes(docType.toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'document_type' should be 'SO' for Sales Order template`,
          row: index + 2,
          column: headers.indexOf("document_type") + 1,
          currentValue: docType
        });
      }

      // Validate date fields for SO (dd-mm-yyyy format)
      const dateFields = ["contract_date", "reference_date", "delivery_date"];
      dateFields.forEach((dateField) => {
        const value = rowObj[dateField];
        if (value && value !== "" && !isValidDateFormat(value)) {
          ifValidationErrors.push({
            description: `Row ${index + 2}: '${dateField}' must be a valid date in DD-MM-YYYY format`,
            row: index + 2,
            column: headers.indexOf(dateField) + 1,
            currentValue: value
          });
        }
      });

      // Validate numeric fields for SO
      const numericFields = ["uom_quantity", "net_price", "net_value", "total_invoice_value"];
      numericFields.forEach((numField) => {
        const value = rowObj[numField];
        if (value && value !== "" && !isValidNumber(value)) {
          ifValidationErrors.push({
            description: `Row ${index + 2}: '${numField}' must be a valid number`,
            row: index + 2,
            column: headers.indexOf(numField) + 1,
            currentValue: value
          });
        }
      });

      // Validate inco terms for SO
      const validIncoTerms = ["fob", "cif", "cfr", "exw", "ddp", "dap", "fca", "cpt", "cip"];
      const incoTerms = rowObj["inco_terms"];
      if (incoTerms && !validIncoTerms.includes(incoTerms.toLowerCase())) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: 'inco_terms' must be one of: ${validIncoTerms.join(", ").toUpperCase()}`,
          row: index + 2,
          column: headers.indexOf("inco_terms") + 1,
          currentValue: incoTerms
        });
      }
    }

    // Common validations for all templates
    // Validate currency code (should be 3 characters) 
    const currencyCode = rowObj["currency_code"] || rowObj["currency"];
    if (currencyCode && currencyCode.length !== 3) {
      const fieldName = rowObj["currency_code"] ? "currency_code" : "currency";
      ifValidationErrors.push({
        description: `Row ${index + 2}: '${fieldName}' must be a 3-character currency code (e.g., USD, EUR, INR)`,
        row: index + 2,
        column: headers.indexOf(fieldName) + 1,
        currentValue: currencyCode
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
            hasMissingValues: false
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
              description: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      rowObj[header.toLowerCase()] = (row[i] || '').toString().trim();
    });

    previewHeaders.forEach((header, colIndex) => {
      const value = row[colIndex] || "";

      // Basic required field checks based on template type
      if (!value.trim() && requiredFields.includes(header)) {
        validationErrors.push({
          description: `${header} is required`,
          row: rowIndex + 1,
          column: colIndex + 1,
          currentValue: value
        });
      }

      // Template-specific validations
      if (templateType === "po") {
        // LC Indicator validation for PO
        if (header === "lc_indicator" && value && !["Y", "N", "y", "n"].includes(value)) {
          validationErrors.push({
            description: "lc_indicator must be Y or N",
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }

        // Number validation for PO
        const numericFields = ["uom_quantity", "net_price", "net_value", "exchange_rate", "payment_to_vendor"];
        if (numericFields.includes(header) && value && isNaN(Number(value))) {
          validationErrors.push({
            description: `${header} must be a number`,
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }

        // Date validation for PO (dd-mm-yyyy format)
        const dateFields = ["contract_date", "reference_date", "exchange_rate_date"];
        if (dateFields.includes(header) && value) {
          if (!isValidDateFormat(value)) {
            validationErrors.push({
              description: `${header} must be valid date in DD-MM-YYYY format`,
              row: rowIndex + 1,
              column: colIndex + 1,
              currentValue: value
            });
          }
        }

      } else if (templateType === "lc") {
        // Amount validation for LC
        if (header === "amount" && value && isNaN(Number(value))) {
          validationErrors.push({
            description: `${header} must be a number`,
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }

        // LC type validation
        const validLcTypes = ["commercial", "standby", "documentary", "revolving"];
        if (header === "lc_type" && value && !validLcTypes.includes(value.toLowerCase())) {
          validationErrors.push({
            description: `lc_type must be one of: ${validLcTypes.join(", ").toUpperCase()}`,
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }

        // Date validation for LC (dd-mm-yyyy format)
        const dateFields = ["issue_date", "expiry_date"];
        if (dateFields.includes(header) && value) {
          if (!isValidDateFormat(value)) {
            validationErrors.push({
              description: `${header} must be valid date in DD-MM-YYYY format`,
              row: rowIndex + 1,
              column: colIndex + 1,
              currentValue: value
            });
          }
        }

        // System LC number validation
        if (header === "system_lc_number" && value && !value.toLowerCase().startsWith("lc")) {
          validationErrors.push({
            description: "system_lc_number should start with 'LC'",
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }

      } else if (templateType === "so") {
        // LC Indicator validation for SO
        if (header === "lc_indicator" && value && !["Y", "N", "y", "n"].includes(value)) {
          validationErrors.push({
            description: "lc_indicator must be Y or N",
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }

        // Document type validation for SO
        const validDocTypes = ["so", "sales order", "sales_order"];
        if (header === "document_type" && value && !validDocTypes.includes(value.toLowerCase())) {
          validationErrors.push({
            description: "document_type should be 'SO' for Sales Order",
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }

        // Number validation for SO
        const numericFields = ["uom_quantity", "net_price", "net_value", "total_invoice_value"];
        if (numericFields.includes(header) && value && isNaN(Number(value))) {
          validationErrors.push({
            description: `${header} must be a number`,
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }

        // Date validation for SO (dd-mm-yyyy format)
        const dateFields = ["contract_date", "reference_date", "delivery_date"];
        if (dateFields.includes(header) && value) {
          if (!isValidDateFormat(value)) {
            validationErrors.push({
              description: `${header} must be valid date in DD-MM-YYYY format`,
              row: rowIndex + 1,
              column: colIndex + 1,
              currentValue: value
            });
          }
        }

        // Inco terms validation for SO
        const validIncoTerms = ["fob", "cif", "cfr", "exw", "ddp", "dap", "fca", "cpt", "cip"];
        if (header === "inco_terms" && value && !validIncoTerms.includes(value.toLowerCase())) {
          validationErrors.push({
            description: `inco_terms must be one of: ${validIncoTerms.join(", ").toUpperCase()}`,
            row: rowIndex + 1,
            column: colIndex + 1,
            currentValue: value
          });
        }
      }

      // Common validations for all templates
      // Currency code validation
      if ((header === "currency_code" || header === "currency") && value && value.length !== 3) {
        validationErrors.push({
          description: "currency_code must be 3 characters",
          row: rowIndex + 1,
          column: colIndex + 1,
          currentValue: value
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
      "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "DOC001", "Y", "2024",
      "15-01-2024", "REF001", "10-01-2024", "VEN001", "Vendor ABC Ltd", "CIF", "USD",
      "NET30", "FOB", "Mumbai Port", "1000000", "PCS", "100", "50.00", "5000.00",
      "1.0", "15-01-2024", "DOC_001", "CC001", "ENT3_001"
    ];
  } else if (template.id === "lc") {
    sampleRow = [
      "LC001", "BANK001", "REF001", "COMMERCIAL", "ABC Company Ltd",
      "XYZ Supplier Inc", "Standard Bank", "USD", "100000",
      "15-01-2024", "15-06-2024", "PO001"
    ];
  } else { // so template
    sampleRow = [
      "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "ENT3_001", "DOC001", "SO",
      "15-01-2024", "REF001", "10-01-2024", "CUST001", "Customer ABC Ltd", "USD",
      "CIF", "NET30", "FOB", "1000000", "LOT001", "Steel Products", "PCS", "100",
      "50.00", "5000.00", "Quality products", "15-02-2024", "Y", "FIXED", "CC001"
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
