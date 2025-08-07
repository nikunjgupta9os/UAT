import { useEffect, useState } from "react";
// import axios from "axios";
import axios from "axios";
import { Suspense } from "react";
import LoadingSpinner from "../../ui/LoadingSpinner";
import TableContent from "./TableContent";
const AllPermissions: React.FC = () => {
  const [data, setData] = useState<PermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSelected] = useState<boolean>(true);

  // Simulate data fetching (replace with your actual API call)
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(
          "https://backend-slqi.onrender.com/api/permissions/roles-status"
        );
         console.log(response.data.rolesStatus);
        setData(response.data.rolesStatus);
        setLoading(false);
      } catch (error) {
         console.error("Error fetching roles:", error);
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Render table content wrapped in Suspense
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TableContent
        data={data}
        searchTerm={searchTerm}
        showSelected={showSelected}
        onSearchChange={setSearchTerm}
        isPending={false} // Set to true to show pending permissions
      />
    </Suspense>
  );
};

export default AllPermissions;
