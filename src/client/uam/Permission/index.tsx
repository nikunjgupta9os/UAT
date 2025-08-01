

import { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../common/Layout";
import AssignPermission from "./AssignPermissions";
import AwaitingPermission from "./AwaitingPermission";

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
      visibility: Visibility.allTab,
    },
    {
      id: "Awaiting",
      label: "All Users",
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
        <span>{tab.label}</span>
      </button>
    ));
  }, [Visibility, activeTab, switchTab, isActiveTab]);

  const currentContent = useMemo(() => {
    switch (activeTab) {
      case "all":
        return <AssignPermission />;
      case "Awaiting":
        return <AwaitingPermission />;
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