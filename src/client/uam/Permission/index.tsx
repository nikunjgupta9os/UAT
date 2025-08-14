

import { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../common/Layout";
import AssignPermission from "./AssignPermissions";
import AwaitingPermission from "./AwaitingPermission";
import AllPermission from "./AllPermission";
import { Users, Clock, ListChecks, Contrast } from "lucide-react";
const useTabNavigation = (initialTab: string = "all") => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const isActiveTab = useCallback(
    (tab: string) => {
      return activeTab === tab;
    },
    [activeTab]
  );

  return {
    activeTab,
    switchTab,
    isActiveTab,
  };
};

type TabVisibility = {
  allTab: boolean;
  uploadTab: boolean;
  pendingTab: boolean;
};

const Permission = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation("all");
  const roleName = localStorage.getItem("userRole");

  const [Visibility, setVisibility] = useState<TabVisibility>({
    allTab: false,
    uploadTab: false,
    pendingTab: false,
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionJSON",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["permissions"];

        if (userTabs) {
          setVisibility({
            allTab: userTabs?.allTab?.hasAccess || false,
            uploadTab: userTabs?.uploadTab?.hasAccess || false,
            pendingTab: userTabs?.pendingTab?.hasAccess || false,
          });
        }
      } catch (error) {
        //  console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, []);
  const TAB_CONFIG = [
    {
      id: "all",
      label: "Assign Permissions",
      icon: Users,
      visibility: Visibility.allTab,
    },
    {
      id: "Awaiting",
      label: "Pending Permissions",
      icon: Contrast,
      visibility: Visibility.allTab,
    },
    {
      id: "AllPermission",
      label: "All Permissions",
      icon: ListChecks,
      visibility: Visibility.allTab,
    },
  ];
  const tabButtons = useMemo(() => {
    return TAB_CONFIG.map((tab) => (
      <button
        key={tab.id}
        onClick={() => switchTab(tab.id)}
        className={`
        flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200
        ${
          isActiveTab(tab.id)
            ? "bg-primary-lt text-white border-primary shadow-sm"
            : "bg-body-hover text-secondary-text border-body-hover hover:bg-body-active hover:text-primary"
        }
      `}
      >
        <span className="flex items-center">
          <tab.icon size={20} className="mr-2" />
          {tab.label}
        </span>
      </button>
    ));
  }, [Visibility, activeTab, switchTab, isActiveTab]);

  const currentContent = useMemo(() => {
    switch (activeTab) {
      case "all":
        return <AssignPermission />;
      case "Awaiting":
        return <AwaitingPermission />;
      case "AllPermission":
        return <AllPermission />;
      default:
        return <AssignPermission />;
    }
  }, [activeTab]);

  return (
    <>
      <Layout title="Permissions">
        <div className="mb-6 pt-4">
          <div className="flex space-x-1 border-b-2 border-primary-lg">
            {tabButtons}
          </div>
        </div>

        <div className="transition-opacity duration-300">{currentContent}</div>
      </Layout>
    </>
  );
};

export default Permission;
