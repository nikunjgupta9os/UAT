import React from "react";
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
// import Layout from "../../common/Layout";
import axios from "axios";
import { useNotification } from "../../Notification/Notification.tsx";
import {
  validateFileContent,
  getFileStatusColor,
  getFileTextColor,
  validatePreviewData,
  handleDownload,
  templates,
  formatFileSize,
} from "./function.ts";

import PreviewTable from "./PreviewTable.tsx";
// import { set } from "date-fns";

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
    default:
      return "so"; // default to SO
  }
};

const UploadFile: React.FC = () => {
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const { notify } = useNotification();
  const [selectedType, setSelectedType] = React.useState("");
  const [previewData, setPreviewData] = React.useState<string[][]>([]);
  const [previewFileName, setPreviewFileName] = React.useState<string>("");
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewHeaders, setPreviewHeaders] = React.useState<string[]>([]);
  const [dragActive, setDragActive] = React.useState(false);
  const [previewStates, setPreviewStates] = React.useState<Record<string, {
    data: string[][];
    headers: string[];
    show: boolean;
  }>>({});

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
    setPreviewStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(fileId => {
        if (updated[fileId].show) {
          updated[fileId].data = updated[fileId].data.filter((_, i) => i !== index);
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

  const handleUpdateRow = (
    rowIndex: number,
    updatedData: Record<string, any>,
    fileId: string
  ) => {
    setPreviewStates(prev => {
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
        // Map selectedType to template type for validation
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
        const [headerRow, ...dataRows] = rows;
        setPreviewStates(prev => ({
          ...prev,
          [uploadedFile.id]: {
            headers: headerRow || [],
            data: dataRows.slice(0, 50),
            show: true,
          }
        }));
      } catch (error) {
        console.error("Error parsing file for preview:", error);
      }
    };
    reader.onerror = () => {
      console.error("Error reading file for preview");
    };
    reader.readAsText(uploadedFile.file);
  };

  const convertToCSVBlob = (headers: string[], rows: string[][]): Blob => {
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    return new Blob([csvContent], { type: "text/csv" });
  };

  const handleSetManually = async () => {
    if (!selectedType) {
      notify("Please select an exposure type before submitting.", "error");
      return;
    }

    // For each file, use edited preview if available
    for (const file of files) {
      let blob: Blob | File | undefined;
      let fileName: string;
      if ((file as any).previewEdited && (file as any).previewHeaders && (file as any).previewData) {
        blob = convertToCSVBlob((file as any).previewHeaders, (file as any).previewData);
        fileName = `${file.name.replace(/\.csv$/, '')}_modified.csv`;
      } else if (file.file) {
        blob = file.file;
        fileName = file.name;
      } else {
        continue;
      }
      const formData = new FormData();
      formData.append(
        selectedType === "PO"
          ? "input_purchase_orders"
          : selectedType === "LC"
          ? "input_letters_of_credit"
          : "input_sales_orders",
        new File([blob], fileName, { type: "text/csv" })
      );
      try {
        const res = await axios.post(
          "https://backend-slqi.onrender.com/api/exposureUpload/batch-upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (res.data.results[0]?.success) {
          notify(`Data for ${file.name} has been successfully sent to the server`, "success");
           setFiles([]);
        } else if (res.data.results && Array.isArray(res.data.results)) {
          const errorMessages = res.data.results
            .filter((r) => !r.success)
            .map((r) => {
              if (r.error && r.error.includes('duplicate key value violates unique constraint')) {
                const match = r.error.match(/constraint "(.+?)"/);
                const constraint = match ? match[1] : "unknown constraint";
                return `Duplicate data found in file '${r.filename}'. Constraint violated: ${constraint}`;
              }
              return `Error in file '${r.filename}': ${r.error}`;
            })
            .join("\n");
          notify(errorMessages, "error");
        } else {
          notify(`Upload failed for ${file.name}: ` + res.data.results[0]?.error, "error");
        }
      } catch (err) {
        console.error(err);
        notify(`Server error occurred during upload for ${file.name}`, "error");
      }
    }
  };

  const handleSavePreview = (fileId: string) => {
    // Save the edited preview data to the file state
    setFiles(prevFiles => prevFiles.map(file => {
      if (file.id === fileId && previewStates[fileId]) {
        return {
          ...file,
          previewHeaders: previewStates[fileId].headers,
          previewData: previewStates[fileId].data,
          previewEdited: true,
        };
      }
      return file;
    }));
    notify(`Edits for ${files.find(f => f.id === fileId)?.name || 'file'} saved.`, "success");
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
                ? "border-green-500 bg-green-50"
                : !selectedType
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
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
                  selectedType ? "text-primary" : "text-gray-400"
                }`}
              />
              <p className="text-sm text-gray-600">
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
                  <span className="text-gray-500">
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
                setFiles([]); // ⛔ This clears all files
              }}
            >
              <option value="">Choose...</option>
              <option value="PO">PO</option>
              <option value="LC">LC</option>
              <option value="SO">SO</option>
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
            <Button disabled>
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
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
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
                                  <li key={index}>{error.description}</li>
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
                      {(file.status === "success" || file.status === "error") && file.file && (
                        <button
                          onClick={() => handlePreviewFile(file)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Preview Data"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {/* Save button for previewed file */}
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
                          setPreviewStates(prev => {
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
                  {previewStates[file.id]?.show && previewStates[file.id]?.data.length > 0 && (
                    <PreviewTable
                      headers={previewStates[file.id].headers}
                      rows={previewStates[file.id].data}
                      onRemoveRow={handleRemoveRow}
                      onUpdateRow={(rowIndex, updatedData) => handleUpdateRow(rowIndex, updatedData, file.id)}
                    />
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
            onUpdateRow={(rowIndex, updatedData) => handleUpdateRow(rowIndex, updatedData, /* fileId not available here */ "preview")}
          />
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="wi-full px-4 py-6">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Download Templates
              </h1>
              <p className="text-gray-600 text-sm">
                Use our standardized templates to ensure your data is formatted
                correctly.
              </p>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between Download">
                    <div className="flex-1 Download">
                      <h3 className="text-base font-medium text-gray-900 mb-1 ">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500">{template.type}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(template)}
                      className="ml-4 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
    </React.Fragment>
  );
};

export default UploadFile;
