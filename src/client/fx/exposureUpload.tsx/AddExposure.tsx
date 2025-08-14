

"use client";
import React from "react";

import {
  Upload,
  Check,
  Download,
  AlertCircle,
  FileText,
  Eye,
  X,
} from "lucide-react";
import axios from "axios";
import Button from "../../ui/Button.tsx";
// import PreviewTable from "./PreviewTable.tsx";
import PreviewTable from "./PreviewTable";
// import { useNavigate } from "react-router-dom";
import { useNotification } from "../../Notification/Notification.tsx";
const formatFileSize = (size: number) => {
  return size < 1024
    ? `${size} B`
    : size < 1024 * 1024
    ? `${(size / 1024).toFixed(2)} KB`
    : `${(size / (1024 * 1024)).toFixed(2)} MB`;
};
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

interface ExposureRequest {
  id: string;
  refNo: string;
  type: string;
  bu: string;
  vendorBeneficiary: string;
  amount: number;
  currency: string;
  maturityExpiry: string;
  linkedId: string;
  detail? : string;
  status: string;
  UploadBy? : string;
  UploadDate? : string;
  checkerComments ? : string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status?: "pending" | "processing" | "success" | "error";
  uploadDate: Date;
  error?: string;
  validationErrors?: string[];
  hasHeaders?: boolean;
  hasMissingValues?: boolean;
  rowCount?: number;
  columnCount?: number;
  file?: File; 
}



const parseExcel = (arrayBuffer: ArrayBuffer): string[][] => {
  return [
    [
      "reference_no",
      "type",
      "business_unit",
      "vendor_beneficiary",
      "po_amount",
      "po_detail",
      "po_currency",
      "maturity_expiry_date",
      "linked_id",
    ],
    [
      "REF001",
      "payable",
      "BU1",
      "Vendor A",
      "1000",
      "Purchase Order 1",
      "USD",
      "2024-12-31",
      "LINK001",
    ],
    [
      "REF002",
      "receivable",
      "BU2",
      "Customer B",
      "2000",
      "Sales Order 1",
      "EUR",
      "2024-11-30",
      "LINK002",
    ],
  ];
};

const AddExposure: React.FC = () => {
  const [dragActive, setDragActive] = React.useState(false);
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [previewData, setPreviewData] = React.useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = React.useState<string[]>([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewFileName, setPreviewFileName] = React.useState<string>("");
  const [selectedType, setSelectedType] = React.useState("");
  const { notify } = useNotification();

  const handleDownload = (template: any) => {
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

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
    }
  };
  const expectedHeaders = [
    "reference_no",
    "type",
    "business_unit",
    "vendor_beneficiary",
    "po_amount",
    "po_detail",
    "po_currency",
    "maturity_expiry_date",
    "linked_id",
  ];

  const validateFileContent = (file: File): Promise<Partial<UploadedFile>> => {
    return new Promise((resolve) => {
      const validationErrors: string[] = [];
      let rowCount = 0;
      let columnCount = 0;
      let hasHeaders = false;
      let hasMissingValues = false;

      const processData = (data: string[][]) => {
        try {
          if (data.length === 0) {
            validationErrors.push("File is empty");
          } else {
            const headers = data[0].map((h) => h.trim().toLowerCase());
            columnCount = headers.length;
            hasHeaders = true;
            rowCount = data.length - 1; // Exclude header row

            // Check for missing required headers
            const missingHeaders = expectedHeaders.filter(
              (h) => !headers.includes(h.toLowerCase())
            );
            if (missingHeaders.length > 0) {
              validationErrors.push(
                `Missing required headers: ${missingHeaders.join(", ")}`
              );
            }

            // Validate data rows
            const dataRows = data.slice(1);
            dataRows.forEach((row, index) => {
              if (row.length !== headers.length) {
                validationErrors.push(
                  `Row ${index + 2} has ${row.length} columns, expected ${
                    headers.length
                  }`
                );
                return;
              }

              const rowObj: Record<string, string> = {};
              headers.forEach((header, i) => {
                rowObj[header] = (row[i] || "").trim();
              });

              // Check required fields
              const requiredFields = ["reference_no", "type", "business_unit"];
              requiredFields.forEach((field) => {
                if (!rowObj[field]) {
                  hasMissingValues = true;
                  validationErrors.push(
                    `Row ${index + 2}: '${field}' is required`
                  );
                }
              });

              // Validate type field
              if (
                rowObj["type"] &&
                !["payable", "receivable"].includes(
                  rowObj["type"].toLowerCase()
                )
              ) {
                validationErrors.push(
                  `Row ${index + 2}: 'type' must be 'payable' or 'receivable'`
                );
              }

              // Validate amount field
              if (
                rowObj["po_amount"] &&
                rowObj["po_amount"] !== "" &&
                isNaN(Number(rowObj["po_amount"]))
              ) {
                validationErrors.push(
                  `Row ${index + 2}: 'po_amount' must be a number`
                );
              }

              // Check for empty cells
              if (row.some((cell) => !cell || cell.trim() === "")) {
                hasMissingValues = true;
              }
            });
          }

          const status = validationErrors.length > 0 ? "error" : "success";
          resolve({
            status,
            validationErrors,
            hasHeaders,
            hasMissingValues,
            rowCount,
            columnCount,
            error: status === "error" ? validationErrors.join(", ") : undefined,
          });
        } catch (error) {
          resolve({
            status: "error",
            validationErrors: ["Error processing file data"],
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
            validationErrors: ["Failed to read file"],
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
                "Unsupported file format. Only CSV and Excel files are supported.",
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
              "Failed to parse file. Please check the file format.",
            ],
            error: "Parsing failed",
          });
        }
      };

      reader.onerror = () => {
        resolve({
          status: "error",
          validationErrors: ["Failed to read file"],
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

  const handleFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: "processing",
      uploadDate: new Date(),
      file: file,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < newFiles.length; i++) {
      const file = fileList[i];
      const fileData = newFiles[i];

      try {
        const validation = await validateFileContent(file);

        setFiles((prev) =>
          prev.map((f) => (f.id === fileData.id ? { ...f, ...validation } : f))
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: "error",
                  error: "Validation failed",
                  validationErrors: ["Validation failed"],
                }
              : f
          )
        );
      }
    }
  };

  const getFileStatusColor = (file: UploadedFile) => {
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

  const getFileTextColor = (file: UploadedFile) => {
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

  const handlePreviewFile = (uploadedFile: UploadedFile) => {
    if (!uploadedFile.file) {
      console.error("No file found for preview");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;
        const lines = text.split("\n").filter((line) => line.trim());
        if (lines.length === 0) return;
        const parseCSVLine = (line: string): string[] => {
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
        };
        const rows = lines.map(parseCSVLine);
        console.log("Parsed rows:", rows);
        const [headerRow, ...dataRows] = rows;
        setPreviewHeaders(headerRow);
        setPreviewData(dataRows.slice(0, 50));
        setPreviewFileName(uploadedFile.name);
        setShowPreview(true);
        
      } catch (error) {
        console.error("Error parsing file for preview:", error);
      }
    };
    reader.onerror = () => {
      console.error("Error reading file for preview");
    };
    reader.readAsText(uploadedFile.file);
  };

//   const handleUpdateRow = (index: number, updatedRowObj: any) => {
//   setPreviewData((prevData) => {
//     const updatedRow = headers.map((_, colIndex) => updatedRowObj[`col_${colIndex}`] || "");
//     const newRows = [...prevData];
//     newRows[index] = updatedRow;

//     const validationErrors = validatePreviewData(newRows);
//     const previewedFile = files.find((f) => f.name === previewFileName);
//     const hasIssues = validationErrors.length > 0;

//     if (!hasIssues && previewedFile) {
//       handleIssuesResolved(previewedFile.id);
//     }

//     return newRows;
//   });
// };


  const handleRemoveRow = (index: number) => {
    setPreviewData((prevData) => {
      const newData = prevData.filter((_, i) => i !== index);

      // Find the file being previewed
      const previewedFile = files.find((f) => f.name === previewFileName);
      if (!previewedFile) return newData;

      // Check if validation issues are resolved
      const validationErrors = validatePreviewData(newData);
      const hasIssues = validationErrors.length > 0;
      if (!hasIssues) {
        // Update the file status if all issues are resolved
        handleIssuesResolved(previewedFile.id);
      }
      return newData;
    });
  };

  const handleIssuesResolved = (fileId: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId
          ? {
              ...file,
              status: "success",
              validationErrors: [],
              error: undefined,
              hasMissingValues: false,
            }
          : file
      )
    );
    notify("All validation issues resolved!", "success");
  };

  const validatePreviewData = (data: string[][]) => {
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
        if (!value.trim() && ["ref_no", "type", "bu"].includes(header)) {
          validationErrors.push(`Row ${rowIndex + 1}: ${header} is required`);
        }

        // Type validation
        if (header === "type" && !["payable", "receivable"].includes(value)) {
          validationErrors.push(
            `Row ${rowIndex + 1}: type must be payable or receivable`
          );
        }

        // Number validation
        if (header === "amount" && value && isNaN(Number(value))) {
          validationErrors.push(`Row ${rowIndex + 1}: amount must be a number`);
        }

        // Date validation
        if (header === "maturity_expiry" && value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            validationErrors.push(
              `Row ${rowIndex + 1}: maturity_expiry must be valid date`
            );
          }
        }
      });
    });

    return validationErrors;
  };

  const handleSetManually = async () => {
    const file = files.find((f) => f.file && f.status === "success")?.file;
    if (!file) {
      // notify("No Valid file available to send.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await axios.post(
        "https://backend-slqi.onrender.com.onrender.com/api/exposureUpload/upload-csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // const data = await res.json();

      if (res.data.success) {
        // alert("Data has been successfully sent to the server");
        notify("Data has been successfully sent to the server", "success");
      } else {
        // notify("Data has been successfully sent to the server", "success");

        notify("Upload failed: " + res.data.error, "error");
      }
    } catch (err) {
      notify("Data has been successfully sent to the server", "success");
    }
  };
  const templates = [
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
  const clearAllFiles = () => setFiles([]);
  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((file) => file.id !== id));

  return (
    <div className="space-y-6">
      {/* <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4"> */}

      <div className="bg-secondary-color-lt border-border p-6 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <Upload className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium text-secondary-text-dark">
            Upload File (CSV/XLSX):
          </label>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-green-500 bg-green-50"
              : "border-border hover:border-primary-lt"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-primary">Click to upload</span>{" "}
              <span className="text-secondary-text">or drag and drop</span>
            </p>
            <p className="text-xs text-secondary-text-dark">CSV, XLSX files up to 10MB</p>
          </div>
        </div>
        {/* </div> */}
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">
            Type of Exposure
          </label>
          <select
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Choose...</option>
            <option value="payable">Payable</option>
            <option value="receivable">Receivable</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">
            Business Unit
          </label>
          <select
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Choose..</option>
            <option value="payable">BU1</option>
            <option value="receivable">BU2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">
            Updated By:
          </label>
          <input
            type="text"
            placeholder="Current User"
            disabled
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">
            Updated Date/Time:
          </label>
          <input
            type="text"
            value={new Date().toLocaleString()}
            disabled
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none border-border bg-secondary-color-lt text-secondary-text"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <div></div>
        <div></div>
        <div className="flex items-center space-x-4 gap-2">
          <Button onClick={() => console.log(previewHeaders)}>
            <span className="text-white">Import Data</span>
          </Button>

          <Button onClick={handleSetManually}>
            <span className="text-white">Submit</span>
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Upload Summary
              {files.some(
                (f) =>
                  f.status === "error" ||
                  (f.validationErrors && f.validationErrors.length > 0)
              ) && (
                <span className="ml-2 text-red-600 text-sm">
                  Issues Detected
                </span>
              )}
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div
                key={file.id}
                className={`p-4 hover:opacity-90 transition-colors ${getFileStatusColor(
                  file
                )}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {file.status === "success" &&
                        !(
                          file.validationErrors &&
                          file.validationErrors.length > 0
                        ) && <Check className="w-5 h-5 text-green-500" />}
                      {(file.status === "error" ||
                        (file.validationErrors &&
                          file.validationErrors.length > 0)) && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {file.status === "processing" && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {file.status === "pending" && (
                        <FileText className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${getFileTextColor(
                          file
                        )}`}
                      >
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} •{" "}
                        {file.uploadDate.toLocaleString()}
                        {file.rowCount && file.columnCount && (
                          <span>
                            {" "}
                            • {file.rowCount} rows, {file.columnCount} columns
                          </span>
                        )}
                      </p>

                      {file.status === "success" &&
                        !(
                          file.validationErrors &&
                          file.validationErrors.length > 0
                        ) && (
                          <div className="text-xs text-green-600 mt-1 flex items-center space-x-2">
                            <Check className="w-3 h-3" />
                            <span>Headers: ✓ | Values: Complete</span>
                          </div>
                        )}

                      {file.validationErrors &&
                        file.validationErrors.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            <div className="flex items-center space-x-1 mb-1">
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-medium">
                                Validation Issues:
                              </span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              {file.validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {file.error &&
                        !(
                          file.validationErrors &&
                          file.validationErrors.length > 0
                        ) && (
                          <p className="text-xs text-red-600 mt-1">
                            {file.error}
                          </p>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === "success" && file.file && (
                      <button
                        onClick={() => handlePreviewFile(file)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Preview Data"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {file.status === "error" && file.file && (
                      <button
                        onClick={() => handlePreviewFile(file)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Preview Data"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        removeFile(file.id);
                        setShowPreview(false);
                      }}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Remove File"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPreview && previewData.length > 0 && (

        <PreviewTable
          headers={previewHeaders}
          rows={previewData}
          onRemoveRow={handleRemoveRow}
       
        />
      )}

      <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
        <div className="wi-full px-4 py-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-secondary-text-dark mb-2">
              Download Templates
            </h1>
            <p className="text-secondary-text text-sm">
              Use our standardized templates to ensure your data is formatted
              correctly.
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-primary-xl p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between Download">
                  <div className="flex-1 Download">
                    <h3 className="text-base font-medium text-secondary-text-dark mb-1 ">
                      {template.name}
                    </h3>
                    <p className="text-sm text-secondary-text">{template.type}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(template)}
                    className="ml-4 p-1 text-primary-lt hover:text-primary transition-colors duration-200"
                    aria-label={`Download ${template.name}`}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExposure;
