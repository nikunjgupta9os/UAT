import React, { useState, useEffect } from "react";
import Button from "../../ui/Button";
import {
  Upload,
  Eye,
  Download,
  AlertCircle,
  Check,
  FileText,
  X,
} from "lucide-react";
import axios from "axios";
import { useNotification } from "../../Notification/Notification.tsx";
import {
  validateFileContent,
  getFileStatusColor,
  getFileTextColor,
  validatePreviewData,
  templates,
  formatFileSize,
} from "./function.ts";
import * as XLSX from "xlsx";
import PreviewTable from "./PreviewTable.tsx";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "pending" | "processing" | "success" | "error";
  uploadDate: Date;
  file?: File;
  validationErrors?: Array<{
    description: string;
    row?: number;
    column?: number;
    currentValue?: string;
  }>;
  error?: string;
  rowCount?: number;
  columnCount?: number;
  hasHeaders?: boolean;
  hasMissingValues?: boolean;
}

// Helper function to map selected type to template type
const getTemplateTypeFromSelected = (selectedType: string): string => {
  switch (selectedType) {
    case "PO":
      return "po";
    case "LC":
      return "lc";
    case "SO":
      return "so";
    case "GRN":
      return "grn";
    case "Creditor":
      return "creditor";
    case "Debtors":
      return "debtors";
    default:
      return "so";
  }
};

const UploadFile: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { notify } = useNotification();
  const [selectedType, setSelectedType] = useState("");
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [previewStates, setPreviewStates] = useState<
    Record<
      string,
      {
        data: string[][];
        headers: string[];
        show: boolean;
        validationErrors?: Array<{
          description: string;
          row?: number;
          column?: number;
          currentValue?: string;
        }>;
      }
    >
  >({});

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!selectedType) {
      return;
    }

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

    if (!selectedType) {
      notify("Please select a type of exposure first.", "warning");
      return;
    }

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    } else {
      notify("No valid files dropped.", "warning");
    }
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
    // notify("All validation issues resolved!", "success");
  };

  const handleRemoveRow = (index: number) => {
    setPreviewStates((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((fileId) => {
        if (updated[fileId].show) {
          updated[fileId].data = updated[fileId].data.filter(
            (_, i) => i !== index
          );
          // Validate after removal
          const validationErrors = validatePreviewData(
            updated[fileId].data,
            updated[fileId].headers,
            getTemplateTypeFromSelected(selectedType)
          );
          const hasIssues = validationErrors.length > 0;
          if (!hasIssues) {
            handleIssuesResolved(fileId);
          }
        }
      });
      return updated;
    });
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

  
const parseExcel = (arrayBuffer: ArrayBuffer): string[][] => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    return data
      .filter((row) =>
        row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
      )
      .map((row, rowIdx) =>
        row.map((cell) => {
          // Try to format as DD-MM-YYYY if it's a date (skip header row)
          if (rowIdx > 0 && isLikelyDate(cell)) {
            return formatToDDMMYYYY(cell);
          }
          return String(cell || "").trim();
        })
      );
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error("Failed to parse Excel file");
  }
};

  const handleUpdateRow = (
    rowIndex: number,
    updatedData: Record<string, any>,
    fileId: string
  ) => {
    setPreviewStates((prev) => {
      const updated = { ...prev };
      if (updated[fileId]) {
        const newData = [...updated[fileId].data];
        if (newData[rowIndex]) {
          Object.entries(updatedData).forEach(([key, value]) => {
            const colIndex = parseInt(key.replace("col_", ""));
            if (!isNaN(colIndex) && colIndex < newData[rowIndex].length) {
              newData[rowIndex][colIndex] = value;
            }
          });
          updated[fileId].data = newData;

          // Re-validate after update
          const templateType = getTemplateTypeFromSelected(selectedType);

          // Ensure validationErrors is always an array of objects with description
          const validationErrors = validatePreviewData(
            newData,
            updated[fileId].headers,
            templateType
          );
          let mappedValidationErrors: {
            description: string;
            row?: number;
            column?: number;
            currentValue?: string;
          }[] = [];
          if (Array.isArray(validationErrors)) {
            mappedValidationErrors = validationErrors
              .map((err) => {
                if (typeof err === "string") {
                  return { description: err };
                } else if (
                  typeof err === "object" &&
                  err !== null &&
                  "description" in err
                ) {
                  return err as {
                    description: string;
                    row?: number;
                    column?: number;
                    currentValue?: string;
                  };
                } else {
                  return null;
                }
              })
              .filter(
                (
                  e
                ): e is {
                  description: string;
                  row?: number;
                  column?: number;
                  currentValue?: string;
                } => e !== null
              );
          } else {
            mappedValidationErrors = [];
          }
          updated[fileId].validationErrors = mappedValidationErrors;

          // Update file status if issues are resolved
          if (validationErrors.length === 0) {
            handleIssuesResolved(fileId);
          }
        }
      }
      return updated;
    });
  };

  const handleFiles = async (fileList: FileList) => {
    // Check if type is selected
    if (!selectedType) {
      notify(
        "Please select a type of exposure before uploading files.",
        "error"
      );
      return;
    }

    // Validate file types
    const invalidFiles = Array.from(fileList).filter((file) => {
      const fileName = file.name.toLowerCase();
      return (
        !fileName.endsWith(".csv") &&
        !fileName.endsWith(".xlsx") &&
        !fileName.endsWith(".xls")
      );
    });

    if (invalidFiles.length > 0) {
      notify(
        `Invalid file type(s): ${invalidFiles
          .map((f) => f.name)
          .join(", ")}. Only CSV and Excel files are accepted.`,
        "error"
      );
      return;
    }

    // Validate file sizes (10MB limit)
    const oversizedFiles = Array.from(fileList).filter(
      (file) => file.size > 10 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      notify(
        `File(s) too large: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}. Maximum size is 10MB.`,
        "error"
      );
      return;
    }

    // Check if files are not empty
    const emptyFiles = Array.from(fileList).filter((file) => file.size === 0);
    if (emptyFiles.length > 0) {
      notify(
        `Empty file(s) detected: ${emptyFiles.map((f) => f.name).join(", ")}.`,
        "error"
      );
      return;
    }

    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: "processing",
      uploadDate: new Date(),
      file: file,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    notify(`Processing ${fileList.length} file(s)...`, "info");

    const processFile = async (file: File, fileData: UploadedFile) => {
      try {
        const templateType = getTemplateTypeFromSelected(selectedType);
        const validation = await validateFileContent(file, templateType);

        if (!validation || !validation.status) {
          throw new Error("Invalid validation result");
        }

        return {
          id: fileData.id,
          update: {
            ...validation,
            status: validation.status,
          },
        };
      } catch (error) {
        console.error("Error processing file:", fileData.name, error);
        return {
          id: fileData.id,
          update: {
            status: "error" as const,
            error: "Validation failed",
            validationErrors: [{ description: "Validation failed" }],
          },
        };
      }
    };

    // Process all files
    for (let i = 0; i < newFiles.length; i++) {
      const file = fileList[i];
      const fileData = newFiles[i];

      const result = await processFile(file, fileData);

      // Apply the update
      setFiles((prev) => {
        return prev.map((f) => {
          if (f.id === result.id) {
            const updated = { ...f, ...result.update };
            console.log(
              `Updating file ${f.name} from ${f.status} to ${updated.status}`
            );
            return updated;
          }
          return f;
        });
      });
      // console.log(fileData.name, "processed with status:", fileData.status);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedType) {
      notify("Please select a type of exposure first.", "warning");
      event.target.value = "";
      return;
    }

    if (event.target.files && event.target.files.length > 0) {
      handleFiles(event.target.files);
    } else {
      notify("No files selected.", "warning");
    }
    // Reset the input so the same file can be selected again if needed
    event.target.value = "";
  };

  const clearAllFiles = () => setFiles([]);
  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((file) => file.id !== id));

  const handlePreviewFile = (uploadedFile: UploadedFile) => {
    // Check if preview is already showing for this file
    if (previewStates[uploadedFile.id]?.show) {
      // Close the preview
      setPreviewStates((prev) => ({
        ...prev,
        [uploadedFile.id]: {
          ...prev[uploadedFile.id],
          show: false,
        },
      }));
      return;
    }

    if (!uploadedFile.file) {
      console.error("No file found for preview");
      return;
    }

    const fileName = uploadedFile.file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        if (!fileData) return;

        let rows: string[][];

        if (isExcel) {
          // Handle Excel files
          rows = parseExcel(fileData as ArrayBuffer);
        } else {
          // Handle CSV files - Fix this part
          const text = fileData as string;
          rows = parseCSV(text); // parseCSV already handles the full text and returns string[][]
        }

        if (rows.length === 0) return;

        const [headerRow, ...dataRows] = rows;

        // Validate the preview data
        const templateType = getTemplateTypeFromSelected(selectedType);

        // Ensure validationErrors is always an array of objects with description
        const validationErrors = validatePreviewData(
          dataRows.slice(0, 50), // Limit to first 50 rows for preview
          headerRow || [],
          templateType
        );
        let mappedValidationErrors: {
          description: string;
          row?: number;
          column?: number;
          currentValue?: string;
        }[] = [];
        if (Array.isArray(validationErrors)) {
          mappedValidationErrors = validationErrors
            .map((err) => {
              if (typeof err === "string") {
                return { description: err };
              } else if (
                typeof err === "object" &&
                err !== null &&
                "description" in err
              ) {
                return err as {
                  description: string;
                  row?: number;
                  column?: number;
                  currentValue?: string;
                };
              } else {
                return null;
              }
            })
            .filter(
              (
                e
              ): e is {
                description: string;
                row?: number;
                column?: number;
                currentValue?: string;
              } => e !== null
            );
        } else {
          mappedValidationErrors = [];
        }

        setPreviewStates((prev) => ({
          ...prev,
          [uploadedFile.id]: {
            headers: headerRow || [],
            data: dataRows.slice(0, 50), // Limit to first 50 rows for performance
            show: true,
            validationErrors: mappedValidationErrors,
          },
        }));

        // Show validation status
        if (validationErrors.length > 0) {
          notify(
            `Preview loaded with ${validationErrors.length} validation issues`,
            "warning"
          );
        } else {
          // notify("Preview loaded successfully", "success");
        }
      } catch (error) {
        console.error("Error parsing file for preview:", error);
        // notify(
        //   "Error parsing file for preview. Please check file format.",
        //   "error"
        // );
      }
    };

    reader.onerror = () => {
      console.error("Error reading file for preview");
      notify("Error reading file for preview", "error");
    };

    // Read file based on type
    if (isExcel) {
      reader.readAsArrayBuffer(uploadedFile.file);
    } else {
      reader.readAsText(uploadedFile.file);
    }
  };

  const convertToCSVBlob = (headers: string[], rows: string[][]): Blob => {
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  };

  const handleSetManually = async () => {
    if (!selectedType) {
      notify("Please select an exposure type before submitting.", "error");
      return;
    }

    // Check if there are any files with validation errors
    const filesWithErrors = files.filter(
      (file) => file.validationErrors && file.validationErrors.length > 0
    );

    if (filesWithErrors.length > 0) {
      notify(
        "Please resolve all validation errors before submitting.",
        "error"
      );
      return;
    }

    notify("Uploading files...", "info");

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        let blob: Blob | File | undefined;
        let fileName: string;

        // Check if file is Excel format
        const isExcelFile =
          file.name.toLowerCase().endsWith(".xlsx") ||
          file.name.toLowerCase().endsWith(".xls");

        // Use edited preview data if available
        if (
          (file as any).previewEdited &&
          previewStates[file.id]?.headers &&
          previewStates[file.id]?.data
        ) {
          // Convert preview data to CSV
          blob = convertToCSVBlob(
            previewStates[file.id].headers,
            previewStates[file.id].data
          );
          fileName = `${file.name.replace(
            /\.(csv|xlsx|xls)$/i,
            ""
          )}_modified.csv`;
        } else if (isExcelFile && file.file) {
          // Convert Excel file to CSV for upload
          try {
            const arrayBuffer = await file.file.arrayBuffer();
            const excelData = parseExcel(arrayBuffer);

            if (excelData.length === 0) {
              throw new Error("Excel file appears to be empty");
            }

            const [headers, ...rows] = excelData;
            blob = convertToCSVBlob(headers, rows);
            fileName = `${file.name.replace(
              /\.(xlsx|xls)$/i,
              ""
            )}_converted.csv`;

            // notify(`Converting ${file.name} to CSV format...`, "info");
          } catch (excelError) {
            errorCount++;

            continue;
          }
        } else if (file.file) {
          // Use original file (CSV)
          blob = file.file;
          fileName = file.name;
        } else {
          errorCount++;
          notify(`No file data found for ${file.name}`, "error");
          continue;
        }

        const formData = new FormData();
        const fieldName =
          selectedType === "PO"
            ? "input_purchase_orders"
            : selectedType === "LC"
            ? "input_letters_of_credit"
            : selectedType === "GRN"
            ? "input_grn"
            : selectedType === "Creditor"
            ? "input_creditors"
            : selectedType === "Debtors"
            ? "input_debitors"
            : "input_sales_orders";

        formData.append(
          fieldName,
          new File([blob], fileName, { type: "text/csv" }) // Always set type as CSV
        );

        console.log(formData, "FormData for upload", fieldName);

        notify(`Uploading ${fileName}...`, "info");

        const res = await axios.post(
          "https://backend-slqi.onrender.com/api/exposureUpload/batch-upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 30000, // 30 second timeout
          }
        );

        if (res.data.results && res.data.results[0]?.success) {
          successCount++;
          notify(`✓ ${file.name} uploaded successfully`, "success");
        } else if (res.data.results && res.data.results[0]) {
          errorCount++;
          const errorMsg = res.data.results[0]?.error || "Unknown error";

          // Handle specific error types
          if (errorMsg.includes("duplicate key")) {
            notify(
              `✗ Upload failed for ${file.name}: Duplicate data found`,
              "error"
            );
          } else if (errorMsg.includes("validation")) {
            notify(
              `✗ Upload failed for ${file.name}: Data validation error`,
              "error"
            );
          } else {
            notify(`✗ Upload failed for ${file.name}: ${errorMsg}`, "error");
          }
        } else {
          errorCount++;
          notify(
            `✗ Upload failed for ${file.name}: Invalid response from server`,
            "error"
          );
        }
      } catch (err) {
        errorCount++;
        console.error(`Error uploading ${file.name}:`, err);

        if (axios.isAxiosError(err)) {
          if (err.code === "ECONNABORTED") {
            notify(
              `✗ Upload timeout for ${file.name}. Please try again.`,
              "error"
            );
          } else if (err.response?.status === 413) {
            notify(`✗ File ${file.name} is too large`, "error");
          } else if (err.response?.status >= 500) {
            notify(
              `✗ Server error occurred during upload for ${file.name}`,
              "error"
            );
          } else {
            notify(
              `✗ Network error occurred during upload for ${file.name}`,
              "error"
            );
          }
        } else {
          notify(
            `✗ Unexpected error occurred during upload for ${file.name}`,
            "error"
          );
        }
      }
    }

    // Final summary
    if (successCount > 0 && errorCount === 0) {
      notify(`All ${successCount} file(s) uploaded successfully!`, "success");
      setFiles([]);
      setPreviewStates({});
    } else if (successCount > 0) {
      notify(
        `${successCount} file(s) uploaded successfully, ${errorCount} failed`,
        "warning"
      );
    } else if (errorCount > 0) {
      notify(`All ${errorCount} file(s) failed to upload`, "error");
    }
  };

  function isLikelyDate(val: any) {
  if (val instanceof Date) return true;
  if (typeof val === "number" && val > 25569 && val < 60000) return true; // Excel serial
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) return true; // ISO
  if (typeof val === "string" && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val)) return true; // D/M/YY, DD/MM/YYYY, etc.
  if (typeof val === "string" && /^\d{1,2}-\d{1,2}-\d{2,4}$/.test(val)) return true; // D-M-YY, DD-MM-YYYY, etc.
  return false;
}

// Format JS Date or string to DD-MM-YYYY
function formatToDDMMYYYY(val: any) {
  let date: Date | null = null;
  if (val instanceof Date) {
    date = val;
  } else if (typeof val === "number") {
    // Excel serial date
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  } else if (typeof val === "string") {
    // Handle D/M/YY or DD/MM/YY or D-M-YY or DD-MM-YYYY
    let d, m, y;
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val)) {
      [d, m, y] = val.split("/");
    } else if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(val)) {
      [d, m, y] = val.split("-");
    }
    if (d && m && y) {
      let yyyy = y.length === 2 ? (parseInt(y, 10) > 50 ? "19" + y : "20" + y) : y;
      date = new Date(`${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      const parts = val.split(/[-\/]/);
      if (parts.length === 3) {
        if (val.includes("-")) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
          } else {
            // DD-MM-YYYY
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else if (val.includes("/")) {
          // MM/DD/YYYY
          date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        }
      }
      if (!date || isNaN(date.getTime())) {
        date = new Date(val);
      }
    }
  }
  if (date && !isNaN(date.getTime())) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return val;
}


  const handleSavePreview = (fileId: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        if (file.id === fileId && previewStates[fileId]) {
          return {
            ...file,
            previewHeaders: previewStates[fileId].headers,
            previewData: previewStates[fileId].data,
            previewEdited: true,
          };
        }
        return file;
      })
    );
    notify(
      `Edits for ${files.find((f) => f.id === fileId)?.name || "file"} saved.`,
      "success"
    );
  };

  // --- Download menu state and handlers (must be inside the component, before return) ---
  const [downloadMenuOpen, setDownloadMenuOpen] = useState<string | null>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".Download")) {
        setDownloadMenuOpen(null);
      }
    };
    if (downloadMenuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [downloadMenuOpen]);

  // Download handler for CSV/XLSX (generates and downloads sample template)
  const handleDownload = (template: any, format: "csv" | "xlsx") => {
    setDownloadMenuOpen(null);
    // Generate sample data for download
    // Get headers and sample row from template type
    let headers: string[] = [];
    let sampleRow: string[] = [];

    if (template.id === "po") {
      headers = [
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
      headers = [
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
    } else if (template.id === "grn") {
      headers = [
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
        "loaded_at",
        "linked_id",
      ];
      sampleRow = [
        "1000", // account
        "COMP001", // company_code
        "BA01", // business_area
        "GR", // document_type
        "CUST001", // customer
        "ASSIGN001", // assignment
        "DOC001", // document_number
        "15-01-2024", // document_date
        "15-01-2024", // posting_date
        "VEN001", // supplier
        "REF001", // reference
        "1000", // amount_in_doc_curr
        "USD", // document_currency
        "750000", // amount_in_local_currency
        "Goods Receipt", // text
        "CLEAR001", // clearing_document
        "15-01-2024", // clearing_date
        "S", // special_gl_ind
        "1000", // offsetting_account
        "USD", // currency_2
        "COMP001", // company
        "2024-08-18T12:00:00Z", // loaded_at (example ISO date)
        "LINK123",
      ];
    } else if (template.id === "creditor") {
      headers = [
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
        "linked_id",
        "company"
      ];
      sampleRow = [
        "N",
        "7000",
        "CHEN",
        "2000001",
        "PAN123456789",
        "400000",
        "15-01-2024",
        "30-01-2024",
        "15-01-2024",
        "KR",
        "31",
        "100000.00",
        "USD",
        "USD",
        "USD",
        "BANKREF001",
        "LINK123",
        "TACO"
      ];
    } else if (template.id === "debtors") {
      headers = [
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
        "linked_id"
      ];
      sampleRow = [
        "REF001",
        "7000",
        "ASSIGN001",
        "7050000252",
        "30-01-2024",
        "DR",
        "15-01-2024",
        "15-01-2024",
        "A",
        "150000.00",
        "150000.00",
        "USD",
        "Customer payment received",
        "CUST001",
        "CLEAR001",
        "130000",
        "USD",
        "ABC Company Ltd",
        "BANKREF002",
        "LINK123"
      ];
    } else {
      headers = [
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
        "linked_id",
      ];
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
        "LIN123"
      ];
    }

    if (format === "csv") {
      // Download as CSV
      const csvContent = [headers, sampleRow]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        template?.name ? `${template.name}.csv` : "Template.csv"
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Download as XLSX
      // Use SheetJS (XLSX) to generate a workbook
      const wsData = [headers, sampleRow];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        template?.name ? `${template.name}.xlsx` : "Template.xlsx"
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <React.Fragment>
      <div className="space-y-6">
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
                ? "border-green-500 bg-secondary-color-lt"
                : !selectedType
                ? "border-primary bg-secondary-color-lt cursor-not-allowed"
                : "border-border hover:border-primary-lt"
            }`}
            // className="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-primary-lt bg-secondary-color-lt text-secondary-text-dark"
            // Upload
            onDragEnter={!selectedType ? undefined : handleDrag}
            onDragLeave={!selectedType ? undefined : handleDrag}
            onDragOver={!selectedType ? undefined : handleDrag}
            onDrop={!selectedType ? undefined : handleDrop}
            onClick={
              !selectedType
                ? () =>
                    notify("Please select a type of exposure first.", "warning")
                : undefined
            }
          >
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              disabled={!selectedType}
              className={`absolute inset-0 w-full h-full opacity-0 ${
                selectedType ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            />
            <div className="space-y-2">
              <Upload
                className={`w-8 h-8 mx-auto ${
                  selectedType ? "text-primary" : "text-primary"
                }`}
              />
              <p className="text-sm text-primary">
                {selectedType ? (
                  <>
                    <span className="font-medium text-primary">
                      Click to upload
                    </span>{" "}
                    <span className="text-secondary-text">
                      or drag and drop
                    </span>
                  </>
                ) : (
                  <span className="text-primary">
                    Please select a type of exposure first
                  </span>
                )}
              </p>
              <p className="text-xs text-secondary-text-dark">
                {selectedType
                  ? "CSV, XLSX files up to 10MB"
                  : "Select exposure type to enable upload"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Type of Exposure
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setFiles([]); // This clears all files
              }}
            >
              <option value="">Choose...</option>
              <option value="PO">PO</option>
              <option value="LC">LC</option>
              <option value="SO">SO</option>
              <option value="GRN">GRN</option>
              <option value="Creditor">Creditor</option>
              <option value="Debtors">Debtors</option>
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
              value={localStorage.getItem("userEmail")}
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
            <Button color="Fade" disabled>
              <span className="text-white">Import Data</span>
            </Button>

            <Button onClick={handleSetManually}>
              <span className="text-white">Submit</span>
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="bg-secondary-color-lt rounded-lg shadow-sm border">
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
                                  Validation Issues (
                                  {file.validationErrors.length}):
                                </span>
                              </div>
                              <ul className="list-disc list-inside space-y-1 ml-4 max-h-20 overflow-y-auto">
                                {file.validationErrors
                                  .slice(0, 3)
                                  .map((error, index) => (
                                    <li key={index}>{error.description}</li>
                                  ))}
                                {file.validationErrors.length > 3 && (
                                  <li className="text-gray-500">
                                    ...and {file.validationErrors.length - 3}{" "}
                                    more issues
                                  </li>
                                )}
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
                      {(file.status === "success" || file.status === "error") &&
                        file.file && (
                          <button
                            onClick={() => handlePreviewFile(file)}
                            className={`p-1 transition-colors ${
                              previewStates[file.id]?.show
                                ? "text-blue-800 bg-blue-100 hover:bg-blue-200"
                                : "text-blue-600 hover:text-blue-800"
                            }`}
                            title={
                              previewStates[file.id]?.show
                                ? "Close Preview"
                                : "Preview Data"
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      {previewStates[file.id]?.show && (
                        <button
                          onClick={() => handleSavePreview(file.id)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Save Edits"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          removeFile(file.id);
                          setPreviewStates((prev) => {
                            const updated = { ...prev };
                            delete updated[file.id];
                            return updated;
                          });
                        }}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Remove File"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Preview for this file */}
                  {previewStates[file.id]?.show &&
                    previewStates[file.id]?.data.length > 0 && (
                      <div className="mt-4">
                        {previewStates[file.id]?.validationErrors &&
                          previewStates[file.id].validationErrors.length >
                            0 && (
                            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                              Preview validation issues:{" "}
                              {previewStates[file.id].validationErrors.length}{" "}
                              found
                            </div>
                          )}
                        <PreviewTable
                          headers={previewStates[file.id].headers}
                          rows={previewStates[file.id].data}
                          onRemoveRow={handleRemoveRow}
                          onUpdateRow={(rowIndex, updatedData) =>
                            handleUpdateRow(rowIndex, updatedData, file.id)
                          }
                        />
                      </div>
                    )}
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
            onUpdateRow={(rowIndex, updatedData) =>
              handleUpdateRow(
                rowIndex,
                updatedData,
                /* fileId not available here */ "preview"
              )
            }
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
                      <p className="text-sm text-primary">{template.type}</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setDownloadMenuOpen(template.id)}
                        className="ml-4 p-1 text-primary-lt hover:text-primary transition-colors duration-200"
                        aria-label={`Download ${template.name}`}
                      >
                        <Download size={16} />
                      </button>
                      {downloadMenuOpen === template.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={() => handleDownload(template, "csv")}
                          >
                            Download as CSV
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={() => handleDownload(template, "xlsx")}
                          >
                            Download as XLSX
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default UploadFile;
