// interface ExposureRequest {
//   id: string;
//   refNo: string;
//   type: string;
//   bu: string;
//   vendorBeneficiary: string;
//   amount: number;
//   currency: string;
//   maturityExpiry: string;
//   linkedId: string;
//   detail? : string;
//   status: string;
//   UploadBy? : string;
//   UploadDate? : string;
//   checkerComments ? : string;
// }

// interface UploadedFile {
//   id: string;
//   name: string;
//   size: number;
//   status?: "pending" | "processing" | "success" | "error";
//   uploadDate: Date;
//   error?: string;
//   validationErrors?: string[];
//   hasHeaders?: boolean;
//   hasMissingValues?: boolean;
//   rowCount?: number;
//   columnCount?: number;
//   file?: File; 
// }


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

interface ifValidationError {
  description: string;
  row?: number;
  column?: number;
  currentValue?: string;
}


interface ifDataToRender {
  status:  "pending" | "processing" | "success" | "error";
  validationErrors: ifValidationError[];
  hasHeaders: boolean;
  hasMissingValues: boolean;
  rowCount: number;
  columnCount: number;
  error?: string;
}


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