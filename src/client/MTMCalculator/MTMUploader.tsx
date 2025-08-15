  import React from "react";
import Button from "../ui/Button.tsx";
import {
  templates,
  formatFileSize,
  handleDownload,
  mtmDisplayHeaders,
  mtmBackendHeaders, 
} from "./MTMUpload.ts";
import Layout from "../common/Layout.tsx";
import {
  validateFileContent,
  getFileTextColor,
  getFileStatusColor,
  validatePreviewData,
} from "./MTMUpload.ts";
import axios from "axios";
import { useNotification } from "../Notification/Notification.tsx";
import PreviewTable from "../fx/exposureUpload.tsx/PreviewTable.tsx"; // Adjust import path as needed
import {
  Upload,
  Eye,
  Download,
  AlertCircle,
  Check,
  FileText,
  X,
} from "lucide-react";

// Import the UploadedFile interface
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status?: "pending" | "processing" | "success" | "error";
  uploadDate: Date;
  error?: string;
  validationErrors?: Array<{
    description: string;
    row?: number;
    column?: number;
    currentValue?: string;
  }>;
  hasHeaders?: boolean;
  hasMissingValues?: boolean;
  rowCount?: number;
  columnCount?: number;
  file?: File;
}

const userName = localStorage.getItem("userEmail");

const FxUploader: React.FC = () => {
  const [dragActive, setDragActive] = React.useState(false);
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [selectedType, setSelectedType] = React.useState<string>("");
  const [previewStates, setPreviewStates] = React.useState<
    Record<
      string,
      {
        data: string[][];
        headers: string[];
        show: boolean;
      }
    >
  >({});
  const { notify } = useNotification();
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFiles(event.target.files);
    } else {
      notify("No files selected.", "warning");
    }
    // Reset the input so the same file can be selected again if needed
    event.target.value = "";
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

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((file) => file.id !== id));

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
            updated[fileId].headers
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
        }
      }
      return updated;
    });
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
        const [headerRow, ...dataRows] = rows;

        // Store in preview states for the new system
        setPreviewStates((prev) => ({
          ...prev,
          [uploadedFile.id]: {
            data: dataRows.slice(0, 50),
            headers: headerRow || [],
            show: true,
          },
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

    const processFile = async (file: File, fileData: UploadedFile) => {
      try {
        const validation = await validateFileContent(file);

        if (!validation || !validation.status) {
          throw new Error("Invalid validation result");
        }

        // Return the update object
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

  const convertToCSVBlob = (headers: string[], rows: string[][]): Blob => {
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    return new Blob([csvContent], { type: "text/csv" });
  };

  const handleSetManually = async () => {
    const validFiles = files.filter(
      (file) =>
        file.status === "success" &&
        (!file.validationErrors || file.validationErrors.length === 0)
    );

    if (validFiles.length === 0) {
      notify("No valid files to upload.", "warning");
      return;
    }

    try {
      for (const file of validFiles) {
        let blob: Blob | File | undefined;
        let fileName: string;

        // Check if file has edited preview data
        if (
          (file as any).previewEdited &&
          (file as any).previewHeaders &&
          (file as any).previewData
        ) {
          blob = convertToCSVBlob(
            (file as any).previewHeaders,
            (file as any).previewData
          );
          fileName = `${file.name.replace(/\.csv$/, "")}_modified.csv`;
        } else if (file.file) {
          blob = file.file;
          fileName = file.name;
        } else {
          continue;
        }

        const formData = new FormData();
        formData.append(
          "files",
          new File([blob], fileName, { type: "text/csv" })
        );

        // Add this line to skip duplicates
        formData.append("skipDuplicates", "true");

        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/forwards/forward-confirmations/upload-multi",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Check if the overall upload was successful
        if (response.data.success && response.data.results) {
          const results = response.data.results;

          let allSucceeded = true;

          // Check for errors in each file's result
          results.forEach((result) => {
            if (result.errors?.length > 0 || result.invalidRows?.length > 0) {
              allSucceeded = false;
              const errorMessage =
                result.errors?.join(", ") ||
                `Invalid rows: ${result.invalidRows?.join(", ")}`;
              notify(
                `Upload partially failed for ${result.filename}: ${errorMessage}`,
                "error"
              );
            } else {
              notify(
                `Upload successful for ${result.filename} (${
                  result.inserted || 0
                } records)`,
                "success"
              );
            }
          });

          if (allSucceeded) {
            // Clear preview states and files
            setPreviewStates({});
            setFiles([]);
          }
        } else {
          // Handle case when overall upload failed
          notify(
            "Upload failed: " + (response.data.message || "Unknown error"),
            "error"
          );
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? {
                    ...f,
                    status: "error",
                    error: response.data.message || "Upload failed",
                  }
                : f
            )
          );
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "error",
          error: "Upload failed",
        }))
      );
      notify("Error uploading files. Please try again.", "error");
    }
  };

  const handleSavePreview = (fileId: string) => {
    // Save the edited preview data to the file state
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

  const clearAllFiles = () => setFiles([]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    }
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

  // Helper to map backend headers to display headers for preview
  const getDisplayHeaders = (headers: string[]) => {
    // If headers match backend, show display headers
    if (
      headers.length === mtmBackendHeaders.length &&
      headers.every((h, i) => h.toLowerCase() === mtmBackendHeaders[i])
    ) {
      return mtmDisplayHeaders;
    }
    // Otherwise, just show what is present
    return headers;
  };

  return (
    <Layout title="MTM Upload">
      <div className="space-y-6">
        <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center space-x-2 mb-4">
            <Upload className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium text-primary">
              Upload File (CSV):
            </label>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-green-500 bg-green-50"
                : "border-border hover:border-primary-lt"
            }`}
            // Upload
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
              <p className="text-sm">
                <span className="font-medium text-primary">
                  Click to upload
                </span>
                <span className="text-secondary-text"> or drag and drop</span>
              </p>
              <p className="text-xs text-secondary-text-dark">
                CSV, XLSX files up to 10MB
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Entity
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
                value={selectedType}
                disabled
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Choose...</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Counter Party
              </label>
              <select
                disabled
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
                // value={selectedType}
                // onChange={(e) => setSelectedType(e.target.value)}
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
                value={userName}
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 pb-6">
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
                                • {file.rowCount} rows, {file.columnCount}{" "}
                                columns
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
                        {(file.status === "success" ||
                          file.status === "error") &&
                          file.file && (
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
                          <PreviewTable
                            headers={getDisplayHeaders(
                              previewStates[file.id].headers
                            )}
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
        </div>

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
                      <p className="text-sm text-secondary-text">
                        {template.type}
                      </p>
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
    </Layout>
  );
};

export default FxUploader;
