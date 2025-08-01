

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../common/Layout";
import AllRoles from "./AllRoles";
import AwaitingRoles from "./AwaitingRoles";
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
  allTab?: boolean;
  uploadTab?: boolean;
  pendingTab?: boolean;
};

const Roles = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation("all");
  const navigate = useNavigate();
  const roleName = localStorage.getItem("userRole");
  const [Visibility, setVisibility] = useState<TabVisibility>({
    // approve: true,
    allTab: true,
    uploadTab: true,
    pendingTab: true,
    // reject: true,
    // view: true,
  });

  const PageChange = () => {
    navigate("/role/create");
  };
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionjson",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["roles"];
        //  console.log(userTabs.allTab.hasAccess);
        if (userTabs) {
          setVisibility({
            allTab: userTabs?.tabs?.allTab?.hasAccess || false,
            uploadTab: userTabs?.tabs?.uploadTab?.hasAccess || false,
            pendingTab: userTabs?.tabs?.pendingTab?.hasAccess || false,
          });
        }
      } catch (error) {
         console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, []);
  const TAB_CONFIG = [
    {
      id: "all",
      label: "All Roles",
      Visbility: Visibility.allTab,
    },
    {
      id: "awaiting",
      label: "Awaiting Approval",
      Visbility: Visibility.pendingTab,
    },
  ];

  const tabButtons = useMemo(() => {
    return TAB_CONFIG.map((tab) => (
      <button
        key={tab.id}
        onClick={() => switchTab(tab.id)}
        className={`
        flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-t-lg border-b transition-all duration-200
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
        return <AllRoles />;
      case "awaiting":
        return <AwaitingRoles />;
      default:
        return <AllRoles />;
    }
  }, [activeTab]);

  return (
    <>
      <Layout
        title="User Roles"
        showButton={Visibility.uploadTab}
        buttonText="Create Role"
        onButtonClick={PageChange}
      >
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

export default Roles;
