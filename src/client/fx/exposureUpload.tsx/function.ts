
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
  },
  {
    id: "lc",
    name: "LC Template",
    type: "Excel",
  },
  {
    id: "bs",
    name: "BS Template",
    type: "Excel",
  },
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
  // This is a simplified Excel parser - in a real app you'd use a proper library
  return [
    [
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
    ],
    [
      "COMP001",
      "CA01",
      "ENT01",
      "ENT1_001",
      "ENT2_001",
      "DOC001",
      "Y",
      "2024",
      "2024-01-15",
      "REF001",
      "2024-01-10",
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
      "2024-01-15",
      "DOC_001",
      "CC001",
    ],
    [
      "COMP002",
      "CA02",
      "ENT02",
      "ENT1_002",
      "ENT2_002",
      "DOC002",
      "N",
      "2024",
      "2024-02-20",
      "REF002",
      "2024-02-15",
      "VEN002",
      "Supplier XYZ Corp",
      "FOB",
      "EUR",
      "NET45",
      "CIF",
      "Chennai Port",
      "2000000",
      "KG",
      "500",
      "25.50",
      "12750.00",
      "0.85",
      "2024-02-20",
      "DOC_002",
      "CC002",
    ],
  ];
};

// Expected headers for PO template
const expectedHeaders = [
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
];

interface ifValidationError {
  description: string;
  row?: number;
  column?: number;
  currentValue?: string;
}

const validateColumns = (
  data: string[][],
  ifValidationErrors: ifValidationError[]
) => {
  let rowCount = 0;
  let columnCount = 0;
  let hasHeaders = false;

  const headers = data[0].map((h) => h.trim().toLowerCase());
  columnCount = headers.length;
  hasHeaders = true;
  rowCount = data.length - 1;

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
  hasMissingValues: boolean
) => {
  const headers = data[0].map((h) => h.trim().toLowerCase());
  const dataRows = data.slice(1);
  
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

    // Check required fields
    const requiredFields = [
      "company_code",
      "controlling_area", 
      "entity",
      "document_no",
      "reference_no",
      "vendor_code",
      "vendor_name",
      "currency_code"
    ];
    
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

    // Validate LC indicator field (Y/N)
    if (rowObj["lc_indicator"] && 
        !["y", "n", "yes", "no"].includes(rowObj["lc_indicator"].toLowerCase())) {
      ifValidationErrors.push({
        description: `Row ${index + 2}: 'lc_indicator' must be 'Y' or 'N'`,
        row: index + 2,
        column: headers.indexOf("lc_indicator") + 1,
        currentValue: rowObj["lc_indicator"]
      });
    }

    // Validate year field (should be 4 digits)
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

    // Validate date fields
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

    // Validate numeric fields
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

    // Validate price basis
    // const validPriceBasis = ["fob", "cif", "cfr", "exw", "ddp", "dap"];
    // if (rowObj["price_basis"] && 
    //     !validPriceBasis.includes(rowObj["price_basis"].toLowerCase())) {
    //   ifValidationErrors.push({
    //     description: `Row ${index + 2}: 'price_basis' must be one of: ${validPriceBasis.join(", ").toUpperCase()}`,
    //     row: index + 2,
    //     column: headers.indexOf("price_basis") + 1,
    //     currentValue: rowObj["price_basis"]
    //   });
    // }

    // Validate inco terms
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

    // Check for empty cells in important fields
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
  file: File
): Promise<Partial<UploadedFile>> => {
  return new Promise((resolve) => {
    const validationErrors: ifValidationError[] = [];
    let rowCount = 0;
    let columnCount = 0;
    let hasHeaders = false;
    let hasMissingValues = false;

    const processData = (data: string[][]) => {
      try {
        validateColumns(data, validationErrors);
        validateRow(data, validationErrors, hasMissingValues);

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
  previewHeaders: string[]
) => {
  const validationErrors: string[] = [];

  // Check for header validation
  const hasMissingHeaders = previewHeaders.some((h) => !h.trim());
  if (hasMissingHeaders) {
    validationErrors.push("Some headers are missing");
  }

  // Check data validation
  data.forEach((row, rowIndex) => {
    previewHeaders.forEach((header, colIndex) => {
      const value = row[colIndex] || "";

      // Basic required field checks
      const requiredFields = ["company_code", "controlling_area", "entity", "document_no", "reference_no", "vendor_code", "vendor_name", "currency_code"];
      if (!value.trim() && requiredFields.includes(header)) {
        validationErrors.push(`Row ${rowIndex + 1}: ${header} is required`);
      }

      // LC Indicator validation
      if (header === "lc_indicator" && value && !["Y", "N", "y", "n"].includes(value)) {
        validationErrors.push(`Row ${rowIndex + 1}: lc_indicator must be Y or N`);
      }

      // Year validation
      if (header === "lc_year" && value) {
        const year = parseInt(value);
        if (isNaN(year) || year < 1900 || year > 2100) {
          validationErrors.push(`Row ${rowIndex + 1}: lc_year must be a valid 4-digit year`);
        }
      }

      // Number validation
      const numericFields = ["uom_quantity", "net_price", "net_value", "exchange_rate"];
      if (numericFields.includes(header) && value && isNaN(Number(value))) {
        validationErrors.push(`Row ${rowIndex + 1}: ${header} must be a number`);
      }

      // Date validation
      const dateFields = ["contract_date", "reference_date", "exchange_rate_date"];
      if (dateFields.includes(header) && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          validationErrors.push(`Row ${rowIndex + 1}: ${header} must be valid date`);
        }
      }

      // Currency code validation
      if (header === "currency_code" && value && value.length !== 3) {
        validationErrors.push(`Row ${rowIndex + 1}: currency_code must be 3 characters`);
      }

      // Price basis validation
      // const validPriceBasis = ["fob", "cif", "cfr", "exw", "ddp", "dap"];
      // if (header === "price_basis" && value && !validPriceBasis.includes(value.toLowerCase())) {
      //   validationErrors.push(`Row ${rowIndex + 1}: price_basis must be one of: ${validPriceBasis.join(", ").toUpperCase()}`);
      // }

      // Inco terms validation
      const validIncoTerms = ["fob", "cif", "cfr", "exw", "ddp", "dap", "fca", "cpt", "cip"];
      if (header === "inco_terms" && value && !validIncoTerms.includes(value.toLowerCase())) {
        validationErrors.push(`Row ${rowIndex + 1}: inco_terms must be one of: ${validIncoTerms.join(", ").toUpperCase()}`);
      }
    });
  });

  return validationErrors;
};

export const handleDownload = (template: any) => {
  // Create template with the 27 standard headers
  const headers = expectedHeaders.join(",");
  const sampleRow = [
    "COMP001", "CA01", "ENT01", "ENT1_001", "ENT2_001", "DOC001", "Y", "2024",
    "2024-01-15", "REF001", "2024-01-10", "VEN001", "Vendor ABC Ltd", "CIF",
    "USD", "NET30", "FOB", "Mumbai Port", "1000000", "PCS", "100", "50.00",
    "5000.00", "1.0", "2024-01-15", "DOC_001", "CC001"
  ].join(",");

  const csvContent = headers + "\n" + sampleRow;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", template?.name ? `${template.name}.csv` : "PO_Template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};