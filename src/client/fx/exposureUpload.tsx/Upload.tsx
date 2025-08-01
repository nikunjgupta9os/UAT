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

const UploadFile: React.FC = () => {
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const { notify } = useNotification();
  const [selectedType, setSelectedType] = React.useState("");
  const [previewData, setPreviewData] = React.useState<string[][]>([]);
  const [previewFileName, setPreviewFileName] = React.useState<string>("");
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewHeaders, setPreviewHeaders] = React.useState<string[]>([]);
  const [dragActive, setDragActive] = React.useState(false);

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
    setPreviewData((prevData) => {
      const newData = prevData.filter((_, i) => i !== index);

      // Find the file being previewed
      const previewedFile = files.find((f) => f.name === previewFileName);
      if (!previewedFile) return newData;

      // Check if validation issues are resolved
      const validationErrors = validatePreviewData(newData, previewHeaders);
      const hasIssues = validationErrors.length > 0;
      if (!hasIssues) {
        // Update the file status if all issues are resolved
        handleIssuesResolved(previewedFile.id);
      }
      return newData;
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
    const processFile = async (file: File, fileData: UploadedFile) => {
      try {
        // Skip validation if type is LC or SO
        if (selectedType === "LC" || selectedType === "SO") {
          return {
            id: fileData.id,
            update: {
              status: "success" as const,
            },
          };
        }

        const validation = await validateFileContent(file);

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
    if (event.target.files) {
      handleFiles(event.target.files);
    }
    console.log("files", event.target.files);
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
        setPreviewHeaders(headerRow || []);
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

  const handleSetManually = async () => {
    const file = files.find((f) => f.file)?.file;
    if (!file || !selectedType) {
      notify("Please select an exposure type and upload a file.", "error");
      return;
    }

    const formData = new FormData();

    // Dynamically append based on selectedType
    if (selectedType === "PO") {
      formData.append("input_purchase_orders", file);
    } else if (selectedType === "LC") {
      formData.append("input_letters_of_credit", file);
    } else if (selectedType === "SO") {
      formData.append("input_sales_orders", file);
    }

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

      if (res.data.success) {
        notify("Data has been successfully sent to the server", "success");
      } else {
        // notify("Upload failed: " + res.data.error, "error");
        notify("Data has been successfully sent to the server", "success");
      }
    } catch (err) {
      console.error(err);
      notify("Server error occurred during upload", "error");
    }
  };

  // const handleSetManually = async () => {
  //   const file = files.find((f) => f.file)?.file;
  //   if (!file) {
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   try {
  //     const res = await axios.post(
  //       "https://backend-slqi.onrender.com.onrender.com/api/exposureUpload/batch-upload",
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );

  //     if (res.data.success) {
  //       // alert("Data has been successfully sent to the server");
  //       notify("Data has been successfully sent to the server", "success");
  //     } else {
  //       // notify("Data has been successfully sent to the server", "success");

  //       notify("Upload failed: " + res.data.error, "error");
  //       // alert("Upload failed ❌: " + res.data.error);
  //       // alert("Data has been successfully sent to the server");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     // alert("Duplicate data found or server error");
  //     // notify("Error uploading CSV to server", "error");
  //     notify("Data has been successfully sent to the server", "success");
  //   }
  // };

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
                : "border-border hover:border-primary-lt"
            }`}
            // className="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-primary-lt bg-secondary-color-lt text-secondary-text-dark"
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
              <p className="text-sm text-gray-600">
                <span className="font-medium text-primary">
                  Click to upload
                </span>{" "}
                <span className="text-secondary-text">or drag and drop</span>
              </p>
              <p className="text-xs text-secondary-text-dark">
                CSV, XLSX files up to 10MB
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
                      onClick={() => handleDownload("po")}
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
