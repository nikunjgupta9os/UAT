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
    name: "Fx Confirmation Template",
    type: "Excel",
  },
  //   {
  //     id: "lc",
  //     name: "LC Template",
  //     type: "Excel",
  //   },
  //   {
  //     id: "bs",
  //     name: "BS Template",
  //     type: "Excel",
  //   },
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
      //   "input_value",
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
      "remarks",
      "narration",
      "transaction_timestamp",
      "bank_transaction_id",
      "swift_unique_id",
      "bank_confirmation_date",
      //   "status",
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
      "FX Spot",
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
      "1000000",
      "Contracted",
      "83.50",
      "0.25",
      "0.10",
      "83.85",
      "1000000",
      "1",
      "83850000",
      "Dealer1",
      "Dealer2",
      "Urgent trade",
      "USD-INR forward",
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
  //   "input_value",
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
  "remarks",
  "narration",
  "transaction_timestamp",
  "bank_transaction_id",
  "swift_unique_id",
  "bank_confirmation_date",
  //   "status",
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
  //   const ifValidationErrors: string[] = [];
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
    ifValidationErrors.push(
      //   `Missing required headers: ${missingHeaders.join(", ")}`
      { description: `Missing required headers: ${missingHeaders.join(", ")}` }
    );
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
        description: `Row ${index + 2} has ${row.length} columns, expected ${
          headers.length
        }`,
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
      //   "input_value",
      "bank_transaction_id",
      "swift_unique_id",
      "bank_confirmation_date",
      "spot_rate",
      "transaction_timestamp",
      //   "status"
    ];

    requiredFields.forEach((field) => {
      if (!rowObj[field]) {
        hasMissingValues = true;
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' is required`,
          row: index + 2,
        });
      }
    });

    [
      "spot_rate",
      "forward_points",
      "bank_margin",
      "total_rate",
      "value_quote_currency",

      "intervening_rate_quote_to_local",
      "value_local_currency",
    ].forEach((field) => {
      if (rowObj[field] && isNaN(Number(rowObj[field]))) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' must be a number`,
          row: index + 2,
        });
      }
    });

    // Date validations
    [
      "add_date",
      "settlement_date",
      "maturity_date",
      "delivery_date",
      "transaction_timestamp",
    ].forEach((field) => {
      if (rowObj[field] && isNaN(Date.parse(rowObj[field]))) {
        ifValidationErrors.push({
          description: `Row ${index + 2}: '${field}' must be a valid date`,
          row: index + 2,
        });
      }
    });

    // Validate type field
    if (
      rowObj["type"] &&
      !["Buy", "Sell"].includes(rowObj["type"].toLowerCase())
    ) {
      ifValidationErrors.push(
        // `Row ${index + 2}: 'type' must be 'payable' or 'receivable'`
        {
          description: `Row ${
            index + 2
          }: 'type' must be 'Buy' or 'Sell'`,
          row: index + 2,
        }
      );
    }

    // Validate amount field
    // if (
    //   rowObj["po_amount"] &&
    //   rowObj["po_amount"] !== "" &&
    //   isNaN(Number(rowObj["po_amount"]))
    // ) {
    //   ifValidationErrors.push(
    //     // `Row ${index + 2}: 'po_amount' must be a number`
    //     {
    //       description: `Row ${index + 2}: 'po_amount' must be a number`,
    //       row: index + 2,
    //     }
    //   );
    // }

    // Check for empty cells
    if (row.some((cell) => !cell || cell.trim() === "")) {
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

        // Only create description string if there are errors
        const errorDescription =
          validationErrors.length > 0
            ? validationErrors.map((e) => e.description).join(", ")
            : undefined;

        const result: ifDataToRender = {
          status: status,
          validationErrors: validationErrors.length > 0 ? validationErrors : [], // Empty array instead of error description when successful
          hasHeaders,
          hasMissingValues,
          rowCount,
          columnCount,
          error: errorDescription, // Only set error if there are actual errors
        };

        console.log("Validation result:", result); // Debug log
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

        // Set the actual row and column counts from parsed data
        rowCount = parsedData.length;
        columnCount = parsedData.length > 0 ? parsedData[0].length : 0;

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
      if (
        !value.trim() &&
        [
          "system_transaction_id",
          "internal_reference_id",
          "currency_pair",
        ].includes(header)
      ) {
        validationErrors.push(`Row ${rowIndex + 1}: ${header} is required`);
      }

      if (
        ["input_value", "spot_rate", "total_rate"].includes(header) &&
        isNaN(Number(value))
      ) {
        validationErrors.push(
          `Row ${rowIndex + 1}: ${header} must be a number`
        );
      }

      if (
        ["add_date", "transaction_timestamp", "maturity_date"].includes(header)
      ) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          validationErrors.push(
            `Row ${rowIndex + 1}: ${header} must be a valid date`
          );
        }
      }
    });
  });

  return validationErrors;
};

export const handleDownload = (template: any) => {
  const csvContent = Object.keys(template)
    .map((key) => `"${key}","${template[key]}"`)
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${template.name}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
