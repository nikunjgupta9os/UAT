import React, { useState } from "react";
import { Upload } from "lucide-react";
import { useNotification } from "../../../Notification/Notification.tsx";

type FileUploadProps = {
  disabled?: boolean;
  title?: string;
  handleFiles: (files: FileList) => void;
  handleFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const FileUpload: React.FC<FileUploadProps> = ({
  disabled = false,
  title = "",
  handleFiles,
  handleFileInput,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const { notify } = useNotification();

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

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

    if (disabled) {
      notify("Upload is disabled.", "warning");
      return;
    }

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    } else {
      notify("No valid files dropped.", "warning");
    }
  };

  return (
    <div>
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
            : disabled
            ? "border-primary bg-secondary-color-lt cursor-not-allowed"
            : "border-border hover:border-primary-lt"
        }`}
        onDragEnter={disabled ? undefined : handleDrag}
        onDragLeave={disabled ? undefined : handleDrag}
        onDragOver={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
        onClick={
          disabled ? () => notify("Upload is disabled.", "warning") : undefined
        }
      >
        <input
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          disabled={disabled}
          title={title}
          className={`absolute inset-0 w-full h-full opacity-0 ${
            !disabled ? "cursor-pointer" : "cursor-not-allowed"
          }`}
        />
        <div className="space-y-2">
          <Upload
            className={`w-8 h-8 mx-auto ${
              !disabled ? "text-primary" : "text-primary"
            }`}
          />
          <p className="text-sm text-primary">
            {!disabled ? (
              <>
                <span className="font-medium text-primary">Click to upload</span>{" "}
                <span className="text-secondary-text">or drag and drop</span>
              </>
            ) : (
              <span className="text-primary">{title}</span>
            )}
          </p>
          <p className="text-xs text-secondary-text-dark">
            {!disabled ? "CSV, XLSX files up to 10MB" : "Enable upload to proceed"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
