interface Role {
  id: number;
  name?: string;
  role_code?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  status?: string;
  createdBy?: string;
  approvedBy?: string | null;
  approveddate?: string | null;
}


type BackendResponse = {
  showCreateButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showApproveButton?: boolean;
  showRejectButton?: boolean;
  roleData?: Role[];
};

