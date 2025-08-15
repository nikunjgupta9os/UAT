import { useMemo, useState, useEffect, useCallback } from "react";
import { FileEdit, UploadCloud, Contrast } from "lucide-react";
import Layout from "../../common/Layout";
import FxConfirmation from "./fxConfirmation";
import FxUploadForm from "./fxUpload";
import TransactionTable from "./pendingForwards";
import LoadingSpinner from "../../ui/LoadingSpinner";
import axios from "axios";

type TabVisibility = {
  fxForm: boolean;
  fxUpload: boolean;
  pendingForwards: boolean;
};

const useTabNavigation = (initialTab: string = "Form") => {
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

const FxConfirmationPage = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation("Form");
  const roleName = localStorage.getItem("userRole");

  const [Visibility, setVisibility] = useState<TabVisibility>({
    fxForm: false,
    fxUpload: false,
    pendingForwards: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionjson",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["forward-confirmation"]?.tabs;

        if (userTabs) {
          setVisibility({
            fxForm: userTabs.fxForm?.hasAccess || false,
            fxUpload: userTabs.uploadTab?.hasAccess || false,
            pendingForwards: userTabs.pendingForward?.hasAccess || false,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const TAB_CONFIG = [
    {
      id: "Form",
      label: "Fx Confirmation Form",
      icon: FileEdit,
      visibility: Visibility.fxForm,
    },
    {
      id: "Upload",
      label: "Fx Confirmation Upload",
      icon: UploadCloud,
      visibility: Visibility.fxUpload,
    },
    {
      id: "add",
      label: "Pending Forwards",
      icon: Contrast,
      visibility: Visibility.pendingForwards,
    },
  ];

  const tabButtons = useMemo(() => {
    return TAB_CONFIG.filter(tab => tab.visibility).map((tab) => (
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
    // Check if current active tab has visibility
    const currentTabConfig = TAB_CONFIG.find(tab => tab.id === activeTab);
    
    if (!currentTabConfig || !currentTabConfig.visibility) {
      return <div className="p-4 text-gray-600">No accessible tabs available.</div>;
    }

    switch (activeTab) {
      case "Form":
        return <FxConfirmation />;
      case "Upload":
        return <FxUploadForm />;
      case "add":
        return <TransactionTable />;
      default:
        return <div className="p-4 text-gray-600">This tab is not available.</div>;
    }
  }, [activeTab, Visibility.fxForm, Visibility.fxUpload, Visibility.pendingForwards]);

  // Only show content if there are visible tabs
  const hasVisibleTabs = TAB_CONFIG.some(tab => tab.visibility);

  // Show loading spinner while fetching permissions
  if (isLoading) {
    return (
      <Layout title="Fx Confirmation" showButton={false}>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Fx Confirmation" showButton={false}>
      {hasVisibleTabs && (
        <div className="mb-6 pt-4">
          <div className="flex space-x-1 border-b border-primary-lg">
            {tabButtons}
          </div>
        </div>
      )}

      <div className="transition-opacity duration-300">
        {hasVisibleTabs ? currentContent : <div className="p-4 text-primary">You don't have access to any tabs.</div>}
      </div>
    </Layout>
  );
};

export default FxConfirmationPage;
