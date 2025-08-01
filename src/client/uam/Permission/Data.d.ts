interface Table {
  RoleName: string;
  PageID: number;
  PageName: string;
}

interface Expansion {
  PageID: number;
  PageName: string;
  Approve: boolean;
  Reject: boolean;
  Edit: boolean;
  View: boolean;
  Delete: boolean;
  Add: boolean;
  Upload: boolean;
}

interface PermissionData {
  roleName: string;
  status: string;
}

type BackendResponse = {
  success: boolean;
  rolesStatus: PermissionData[];
};