import Layout from "../common/Layout";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MTMRateInput from "./MTMRateInput.tsx";
import MTMRateManagement from "./MTMRateManagement.tsx";
import type { TabVisibility } from "./Data.d";

const useTabNavigation = (initialTab: string = "input") => {
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

const MTMRate: React.FC = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation("input");
  const navigate = useNavigate();
  const roleName = localStorage.getItem("userRole");

  const [Visibility, setVisibility] = useState<TabVisibility>({
    inputTab: true,
    managementTab: true,
  });

  const PageChange = () => {
    navigate("/mtm-rate/Input");
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionJSON",
          { roleName }
        );

        const pages = response.data?.pages;
        const mtmRateTabs = pages?.["mtm-rate"];

        if (mtmRateTabs) {
          setVisibility({
            inputTab: mtmRateTabs?.inputTab?.hasAccess || false,
            managementTab: mtmRateTabs?.managementTab?.hasAccess || false,
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
      id: "input",
      label: "MTM Rate Input",
      visibility: Visibility.inputTab,
    },
    {
      id: "management",
      label: "MTM Rate Management",
      visibility: Visibility.managementTab,
    },
  ];

  const tabButtons = useMemo(() => {
    return TAB_CONFIG.filter(tab => tab.visibility).map((tab) => (
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
      case "input":
        return <MTMRateInput />;
      case "management":
        return <MTMRateManagement />;
      default:
        return <MTMRateInput />;
    }
  }, [activeTab]);
  
  return (
    <Layout 
      title="MTM Rate Input"
    >
      <div className="mb-6 pt-4">
        <div className="flex space-x-1 border-b-2 border-primary-lg">{tabButtons}</div>
      </div>
      <div className="transition-opacity duration-300">{currentContent}</div>
    </Layout>
  )
}

export default MTMRate;