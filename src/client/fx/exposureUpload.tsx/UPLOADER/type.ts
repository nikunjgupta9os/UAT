
export type ValidationError = {
  description: string;
  row?: number;
  column?: number;
  currentValue?: string;
};

export type PreviewState = {
  data: string[][];
  headers: string[];
  show: boolean;
  validationErrors?: ValidationError[];
};

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  status: "pending" | "processing" | "success" | "error";
  uploadDate: Date;
  file?: File;
  validationErrors?: ValidationError[];
  error?: string;
  rowCount?: number;
  columnCount?: number;
  hasHeaders?: boolean;
  hasMissingValues?: boolean;
}

export type ValidationConfig = {
  requiredHeaders: string[];
  requiredFields: string[];
  numericFields: string[];
};
