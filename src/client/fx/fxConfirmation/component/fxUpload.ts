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

export const templates = [
  {
    id: "fx",
    name: "Fx confirmation Template",
    type: "Excel",
  },
];

const parseExcel = (arrayBuffer: ArrayBuffer): string[][] => {
  // Simulated Excel parsing for FX Confirmation Template
  return [
    [
      "internal_reference_id",
      "entity_level_0",
      "entity_level_1",
      "entity_level_2",
      "entity_level_3",
      "local_currency",
      "order_type",
      "transaction_type",
      "counterparty",
      "mode_of_delivery",
      "delivery_period",
      "add_date",
      "settlement_date",
      "maturity_date",
      "delivery_date",
      "currency_pair",
      "base_currency",
      "quote_currency",
      "value_type",
      "actual_value_base_currency",
      "spot_rate",
      "forward_points",
      "bank_margin",
      "total_rate",
      "value_quote_currency",
      "intervening_rate_quote_to_local",
      "value_local_currency",
      "internal_dealer",
      "counterparty_dealer",
      "bank_transaction_id",
      "swift_unique_id",
      "bank_confirmation_date",
    ],
    [
      "TX123",
      "INT123",
      "Corp",
      "DivA",
      "DeptB",
      "SubDept1",
      "INR",
      "Buy",
      "FX SPOT",
      "Bank A",
      "Online",
      "1D",
      "2024-01-01",
      "2024-01-02",
      "2024-01-10",
      "2024-01-03",
      "USD/INR",
      "USD",
      "INR",
      "Contracted",
      "1000000",
      "83.50",
      "0.25",
      "0.10",
      "83.85",
      "1000000",
      "1",
      "83850000",
      "Dealer1",
      "Dealer2",
      "BANK123456",
      "SWIFT789012",
      "2024-01-01",
    ],
  ];
};

const expectedHeaders = [
  "internal_reference_id",
  "entity_level_0",
  "entity_level_1",
  "entity_level_2",
  "entity_level_3",
  "local_currency",
  "order_type",
  "transaction_type",
  "counterparty",
  "mode_of_delivery",
  "delivery_period",
  "add_date",
  "settlement_date",
  "maturity_date",
  "delivery_date",
  "currency_pair",
  "base_currency",
  "quote_currency",
  "value_type",
  "actual_value_base_currency",
  "spot_rate",
  "forward_points",
  "bank_margin",
  "total_rate",
  "value_quote_currency",
  "intervening_rate_quote_to_local",
  "value_local_currency",
  "internal_dealer",
  "counterparty_dealer",
  "bank_transaction_id",
  "swift_unique_id",
  "bank_confirmation_date",
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

  // // Check for extra headers
  // const extraHeaders = headers.filter(
  //   (h) => !expectedHeaders.map(eh => eh.toLowerCase()).includes(h.toLowerCase())
  // );
  // if (extraHeaders.length > 0) {
  //   ifValidationErrors.push({
  //     description: `Unexpected headers found: ${extraHeaders.join(", ")}`
  //   });
  // }
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
      "internal_reference_id",
      "local_currency",
      "currency_pair",
      "bank_transaction_id",
      "swift_unique_id",
      "bank_confirmation_date",
      "spot_rate",
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

    // Validate numeric fields
    const numericFields = [
      "spot_rate",
      "forward_points",
      "bank_margin",
      "total_rate",
      "value_quote_currency",
      "intervening_rate_quote_to_local",
      "value_local_currency",
      // "actual_value_base_currency"
    ];
    
    numericFields.forEach((field) => {
      if (rowObj[field] && rowObj[field] !== "" && isNaN(Number(rowObj[field]))) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' must be a valid number`,
          row: index + 2,
          column: headers.indexOf(field) + 1,
          currentValue: rowObj[field]
        });
      }
    });

    // Date validations
    // const dateFields = [
    //   "add_date",
    //   "settlement_date", 
    //   "maturity_date",
    //   "delivery_date",
    //   "bank_confirmation_date",
    // ];
    
    // dateFields.forEach((field) => {
    //   if (rowObj[field] && rowObj[field] !== "") {
    //     const date = new Date(rowObj[field]);
    //     if (isNaN(date.getTime())) {
    //       ifValidationErrors.push({
    //         description: `Row ${index + 2}: '${field}' must be a valid date (YYYY-MM-DD format)`,
    //         row: index + 2,
    //         column: headers.indexOf(field) + 1,
    //         currentValue: rowObj[field]
    //       });
    //     }
    //   }
    // });

    // Validate order type
    // const validOrderTypes = ["buy", "sell"];
    // if (rowObj["order_type"] && 
    //     !validOrderTypes.includes(rowObj["order_type"].toLowerCase())) {
    //   ifValidationErrors.push({
    //     description: `Row ${index + 2}: 'order_type' must be 'Buy' or 'Sell'`,
    //     row: index + 2,
    //     column: headers.indexOf("order_type") + 1,
    //     currentValue: rowObj["order_type"]
    //   });
    // }

    // Validate transaction type
    // const validTransactionTypes = ["fx spot", "fx forward", "fx swap", "fx option"];
    // if (rowObj["transaction_type"] && 
    //     !validTransactionTypes.includes(rowObj["transaction_type"].toLowerCase())) {
    //   ifValidationErrors.push({
    //     description: `Row ${index + 2}: 'transaction_type' must be one of: ${validTransactionTypes.join(", ").toUpperCase()}`,
    //     row: index + 2,
    //     column: headers.indexOf("transaction_type") + 1,
    //     currentValue: rowObj["transaction_type"]
    //   });
    // }

    // // Validate currency pair format (should be like USD/INR)
    // if (rowObj["currency_pair"] && rowObj["currency_pair"] !== "") {
    //   const currencyPairPattern = /^[A-Z]{3}\/[A-Z]{3}$/;
    //   if (!currencyPairPattern.test(rowObj["currency_pair"])) {
    //     ifValidationErrors.push({
    //       description: `Row ${index + 2}: 'currency_pair' must be in format 'XXX/YYY' (e.g., USD/INR)`,
    //       row: index + 2,
    //       column: headers.indexOf("currency_pair") + 1,
    //       currentValue: rowObj["currency_pair"]
    //     });
    //   }
    // }

    // // Validate currency codes (should be 3 characters)
    // const currencyFields = ["local_currency", "base_currency", "quote_currency"];
    // currencyFields.forEach((field) => {
    //   if (rowObj[field] && rowObj[field].length !== 3) {
    //     ifValidationErrors.push({
    //       description: `Row ${index + 2}: '${field}' must be a 3-character currency code (e.g., USD, EUR, INR)`,
    //       row: index + 2,
    //       column: headers.indexOf(field) + 1,
    //       currentValue: rowObj[field]
    //     });
    //   }
    // });

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
          validationErrors: [
            {
              description: "File read error",
            },
          ],
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
              description:
                "Failed to parse file. Please check the file format.",
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
      const requiredFields = [
        "internal_reference_id",
        "local_currency", 
        "currency_pair",
        "bank_transaction_id",
        "swift_unique_id",
        "bank_confirmation_date",
        "spot_rate"
      ];
      
      if (!value.trim() && requiredFields.includes(header)) {
        validationErrors.push(`Row ${rowIndex + 1}: ${header} is required`);
      }

      // Numeric field validation
      const numericFields = [
        "spot_rate",
        "forward_points", 
        "bank_margin",
        "total_rate",
        "value_quote_currency",
        "intervening_rate_quote_to_local",
        "value_local_currency",
        "actual_value_base_currency"
      ];
      
      if (numericFields.includes(header) && value && isNaN(Number(value))) {
        validationErrors.push(`Row ${rowIndex + 1}: ${header} must be a number`);
      }

      // Date field validation
      const dateFields = [
        "add_date",
        "settlement_date",
        "maturity_date", 
        "delivery_date",
        "bank_confirmation_date"
      ];
      
      if (dateFields.includes(header) && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          validationErrors.push(`Row ${rowIndex + 1}: ${header} must be valid date`);
        }
      }

      // Order type validation
      if (header === "order_type" && value && !["buy", "sell"].includes(value.toLowerCase())) {
        validationErrors.push(`Row ${rowIndex + 1}: order_type must be 'Buy' or 'Sell'`);
      }

      // Transaction type validation
      const validTransactionTypes = ["fx spot", "fx forward", "fx swap", "fx option"];
      if (header === "transaction_type" && value && !validTransactionTypes.includes(value.toLowerCase())) {
        validationErrors.push(`Row ${rowIndex + 1}: transaction_type must be one of: ${validTransactionTypes.join(", ").toUpperCase()}`);
      }

      // Currency pair format validation
      if (header === "currency_pair" && value) {
        const currencyPairPattern = /^[A-Z]{3}\/[A-Z]{3}$/;
        if (!currencyPairPattern.test(value)) {
          validationErrors.push(`Row ${rowIndex + 1}: currency_pair must be in format 'XXX/YYY' (e.g., USD/INR)`);
        }
      }

      // Currency code validation
      const currencyFields = ["local_currency", "base_currency", "quote_currency"];
      if (currencyFields.includes(header) && value && value.length !== 3) {
        validationErrors.push(`Row ${rowIndex + 1}: ${header} must be 3 characters`);
      }
    });
  });

  return validationErrors;
};

export const handleDownload = (template: any) => {
  // Create headers row
  const headers = expectedHeaders.join(",");
  
  // Create sample data row for FX Confirmation template
  const sampleRow = [
    "TX123",
      "INT123",
      "Corp",
      "DivA",
      "DeptB",
      "SubDept1",
      "INR",
      "Buy",
      "FX SPOT",
      "Bank A",
      "Online",
      "1D",
      "2024-01-01",
      "2024-01-02",
      "2024-01-10",
      "2024-01-03",
      "USD/INR",
      "USD",
      "INR",
      "Contracted",
      "1000000",
      "83.50",
      "0.25",
      "0.10",
      "83.85",
      "1000000",
      "1",
      "83850000",
      "Dealer1",
      "Dealer2",
      "BANK123456",
      "SWIFT789012",
      "2024-01-01",
  ];

  const csvContent = headers + "\n" + sampleRow.join(",");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", template?.name ? `${template.name}.csv` : "FX_Confirmation_Template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
