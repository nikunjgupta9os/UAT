const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const mtmDisplayHeaders = [
  "Internal Reference ID",
  "Deal Date",
  "Maturity Date",
  "Currency Pair",
  "Buy/Sell",
  "Notional Amount",
  "Contract Rate",
  "MTM Rate",
  "MTM Value",
  "Days to Maturity",
  "Entity",
];

// Backend headers (for CSV upload/download)
export const mtmBackendHeaders = [
  "internal_reference_id",
  "deal_date",
  "maturity_date",
  "currency_pair",
  "buy_sell",
  "notional_amount",
  "contract_rate",
  "mtm_rate",
  "mtm_value",
  "days_to_maturity",
  "entity",
];

// Sample row for template
const mtmSampleRow = [
  "INTREF001",
  "2025-08-01",
  "2025-12-31",
  "USD/INR",
  "Buy",
  "1000000",
  "83.50",
  "84.00",
  "500000",
  "4M",
  "EntityA",
];

export const templates = [
  {
    id: "mtm",
    name: "MTM Upload Template",
    type: "CSV",
    headers: mtmBackendHeaders,
    sampleRow: mtmSampleRow,
  },
];

// CSV parsing
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

interface ifValidationError {
  description: string;
  row?: number;
  column?: number;
  currentValue?: string;
}

// Validate columns for MTM
const validateColumns = (
  data: string[][],
  ifValidationErrors: ifValidationError[]
) => {
  const headers = data[0].map((h) => h.trim().toLowerCase());
  const expected = mtmBackendHeaders.map((h) => h.toLowerCase());
  // Check missing
  const missingHeaders = expected.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    ifValidationErrors.push({
      description: `Missing required headers: ${missingHeaders.join(", ")}`
    });
  }
  // Check extra
  const extraHeaders = headers.filter((h) => !expected.includes(h));
  if (extraHeaders.length > 0) {
    ifValidationErrors.push({
      description: `Unexpected headers found: ${extraHeaders.join(", ")}`
    });
  }
};

// Validate rows for MTM
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

    // Required fields
    const requiredFields = [
      "internal_reference_id",
      "deal_date",
      "maturity_date",
      "currency_pair",
      "buy_sell",
      "notional_amount",
      "contract_rate",
      "mtm_rate",
      "mtm_value",
      "days_to_maturity",
      "entity",
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

    // Numeric fields
    const numericFields = [
      "notional_amount",
      "contract_rate",
      "mtm_rate",
      "mtm_value",
      "days_to_maturity",
    ];
    numericFields.forEach((field) => {
      if (rowObj[field] && isNaN(Number(rowObj[field]))) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' must be a valid number`,
          row: index + 2,
          column: headers.indexOf(field) + 1,
          currentValue: rowObj[field]
        });
      }
    });

    // Date fields
    const dateFields = ["deal_date", "maturity_date"];
    dateFields.forEach((field) => {
      if (rowObj[field] && isNaN(Date.parse(rowObj[field]))) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' must be a valid date (YYYY-MM-DD)`,
          row: index + 2,
          column: headers.indexOf(field) + 1,
          currentValue: rowObj[field]
        });
      }
    });

    // Currency Pair format
    if (rowObj["currency_pair"] && !/^[A-Z]{3}\/[A-Z]{3}$/.test(rowObj["currency_pair"])) {
      ifValidationErrors.push({
        description: `Row ${index + 2}: 'currency_pair' must be in format 'XXX/YYY' (e.g., USD/INR)`,
        row: index + 2,
        column: headers.indexOf("currency_pair") + 1,
        currentValue: rowObj["currency_pair"]
      });
    }

    // Buy/Sell
    if (rowObj["buy_sell"] && !["buy", "sell"].includes(rowObj["buy_sell"].toLowerCase())) {
      ifValidationErrors.push({
        description: `Row ${index + 2}: 'buy_sell' must be 'Buy' or 'Sell'`,
        row: index + 2,
        column: headers.indexOf("buy_sell") + 1,
        currentValue: rowObj["buy_sell"]
      });
    }
  });
};

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
        rowCount = data.length > 0 ? data.length - 1 : 0;
        columnCount = data.length > 0 ? data[0].length : 0;
        hasHeaders = data.length > 0;

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

        resolve(result as Partial<UploadedFile>);
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
          validationErrors: [
            { description: "File read error" },
          ],
          error: "File read error",
        });
        return;
      }

      try {
        let parsedData: string[][];
        parsedData = parseCSV(fileData as string);

        // ---- ADD THIS LINE: ----
        parsedData = transformDisplayToBackend(parsedData);

        rowCount = parsedData.length > 0 ? parsedData.length - 1 : 0;
        columnCount = parsedData.length > 0 ? parsedData[0].length : 0;
        hasHeaders = parsedData.length > 0;

        processData(parsedData);
      } catch (error) {
        resolve({
          status: "error",
          validationErrors: [
            { description: "Failed to parse file. Please check the file format." },
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

    reader.readAsText(file);
  });
};

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

// For preview table validation
export const validatePreviewData = (
  data: string[][],
  previewHeaders: string[]
) => {
  const validationErrors: string[] = [];
  // Check for header validation
  if (
    previewHeaders.length !== mtmBackendHeaders.length ||
    !mtmBackendHeaders.every((h, i) => h === (previewHeaders[i] || "").toLowerCase())
  ) {
    validationErrors.push("Headers do not match the required MTM template.");
  }
  // Validate each row
  data.forEach((row, rowIndex) => {
    if (row.length !== mtmBackendHeaders.length) {
      validationErrors.push(`Row ${rowIndex + 1}: Incorrect number of columns`);
    }
    // Required fields
    if (!row[0]) validationErrors.push(`Row ${rowIndex + 1}: Forward ID is required`);
    if (!row[1]) validationErrors.push(`Row ${rowIndex + 1}: Deal Date is required`);
    if (!row[2]) validationErrors.push(`Row ${rowIndex + 1}: Maturity Date is required`);
    if (!row[3]) validationErrors.push(`Row ${rowIndex + 1}: Currency Pair is required`);
    if (!row[4]) validationErrors.push(`Row ${rowIndex + 1}: Buy/Sell is required`);
    if (!row[5] || isNaN(Number(row[5]))) validationErrors.push(`Row ${rowIndex + 1}: Notional Amount must be a number`);
    if (!row[6] || isNaN(Number(row[6]))) validationErrors.push(`Row ${rowIndex + 1}: Contract Rate must be a number`);
    if (!row[7] || isNaN(Number(row[7]))) validationErrors.push(`Row ${rowIndex + 1}: MTM Rate must be a number`);
    if (!row[8] || isNaN(Number(row[8]))) validationErrors.push(`Row ${rowIndex + 1}: MTM Value must be a number`);
    if (!row[9] || isNaN(Number(row[9]))) validationErrors.push(`Row ${rowIndex + 1}: Days to Maturity must be a number`);
    // Date format check (YYYY-MM-DD)
    if (row[1] && isNaN(Date.parse(row[1]))) validationErrors.push(`Row ${rowIndex + 1}: Deal Date must be a valid date`);
    if (row[2] && isNaN(Date.parse(row[2]))) validationErrors.push(`Row ${rowIndex + 1}: Maturity Date must be a valid date`);
    // Currency Pair format
    if (row[3] && !/^[A-Z]{3}\/[A-Z]{3}$/.test(row[3])) validationErrors.push(`Row ${rowIndex + 1}: Currency Pair must be in format XXX/YYY`);
    // Buy/Sell
    if (row[4] && !["buy", "sell"].includes(row[4].toLowerCase())) validationErrors.push(`Row ${rowIndex + 1}: Buy/Sell must be 'Buy' or 'Sell'`);
  });
  return validationErrors;
};

// Download template
export const handleDownload = (template: any) => {
  // Use display headers for sample download
  const headers = mtmDisplayHeaders.join(",");
  const sampleRow = mtmSampleRow.join(",");
  const csvContent = headers + "\n" + sampleRow;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", template?.name ? `${template.name}.csv` : "MTM_Upload_Template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 1. Mapping between display and backend headers
const displayToBackendMap: Record<string, string> = {
  "Internal Reference ID": "internal_reference_id",
  "Deal Date": "deal_date",
  "Maturity Date": "maturity_date",
  "Currency Pair": "currency_pair",
  "Buy/Sell": "buy_sell",
  "Notional Amount": "notional_amount",
  "Contract Rate": "contract_rate",
  "MTM Rate": "mtm_rate",
  "MTM Value": "mtm_value",
  "Days to Maturity": "days_to_maturity",
  "Entity": "entity",
};

// 2. Transform CSV headers and rows to backend format
export function transformDisplayToBackend(data: string[][]): string[][] {
  if (!data.length) return data;
  const headerRow = data[0];
  // Map display headers to backend headers
  const mappedHeaders = headerRow.map(h => displayToBackendMap[h.trim()] || h.trim());
  // Return new data with mapped headers
  return [mappedHeaders, ...data.slice(1)];
}

// Example usage in your file processing logic:
// parsedData = transformDisplayToBackend(parsedData);
