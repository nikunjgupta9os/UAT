// type FormData = {
//   authentication_type: string;
//   employee_name: string;
//   username_or_employee_id: string;
//   email: string;
//   mobile: string;
//   address: string;
//   business_unit_name: string;
//   created_by: string;
// };

type FormData = {
  processname: string;
  authenticationType: string;
  employeeName: string;
  usernameOrEmployeeId: string;
  roleName: string;
  email: string;
  mobile: string;
  address: string;
  businessUnitName: string;
};

type TabVisibility = {
  allTab: boolean;
  uploadTab: boolean;
  pendingTab: boolean;
};

interface UserType {
  id: number;
  authenticationType: string;          // Maps from authentication_type
  employeeName: string;                // Maps from employee_name
  username: string;                    // Maps from username_or_employee_id
  email: string;
  mobile: string;
  address: string;
  businessUnitName: string;            // Maps from business_unit_name
  status: string;                      // approved / pending / rejected
  createdBy: string;                   // Maps from created_by
  createdDate: string; 
  role?:string;               // Maps from created_at

  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  approvalComment?: string | null;

  password?: string;                   // Only if you really need to keep it
}
