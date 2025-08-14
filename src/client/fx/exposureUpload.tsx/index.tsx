import Layout from "../../common/Layout";
import { useMemo, useState, useCallback, useEffect } from "react";
import PendingRequest from "./PendingRequest";
import AddExposure from "./Upload";
import AllExposureRequest from "./pp";
import axios from "axios";
import { List, Clock, UploadCloud, Contrast } from "lucide-react";
const useTabNavigation = (initialTab: string = 'existing') => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);
  const isActiveTab = useCallback((tab: string) => {
    return activeTab === tab;
  }, [activeTab]);
  return {
    activeTab,
    switchTab,
    isActiveTab
  };
};

type TabVisibility = {
  allTab?: boolean;
  uploadTab?: boolean;
  pendingTab?: boolean;
};

const ExposureUpload = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation('existing');

  const roleName = localStorage.getItem("userRole");
  const [Visibility, setVisibility] = useState<TabVisibility>({
    allTab: true,
    uploadTab: true,
    pendingTab: true,
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionJSON",
          { roleName }
        );
        console.log("Permissions response:", response.data);
        const pages = response.data?.pages;
        const userTabs = pages?.["exposure-upload"]?.tabs;
        if (userTabs) {
          setVisibility({
            allTab: userTabs?.allTab?.hasAccess || false,
            uploadTab: userTabs?.allTab?.hasAccess || false,
            pendingTab: userTabs?.allTab?.hasAccess || false,
          });
        }
      } catch (error) {
         console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, []);

  const tabButtons = useMemo(() => {
    const tabConfig = [
      { id: 'existing', label: 'All Exposure Request', icon: List, visible: Visibility.allTab },
      { id: 'forwards', label: 'Pending Exposure Request', icon: Contrast, visible: Visibility.pendingTab },
      { id: 'add', label: 'Add Exposure', icon: UploadCloud, visible: Visibility.uploadTab },
    ];

    return tabConfig
      .filter(tab => tab.visible)
      .map(tab => (
        <button
          key={tab.id}
          onClick={() => switchTab(tab.id)}
          className={`
            flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200
            ${isActiveTab(tab.id)
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
    if (activeTab === 'existing' && Visibility.allTab) return <AllExposureRequest />;
    if (activeTab === 'forwards' && Visibility.pendingTab) return <PendingRequest />;
    if (activeTab === 'add' && Visibility.uploadTab) return <AddExposure />;
    return <div className="p-4 text-gray-600">This tab is not available.</div>;
  }, [activeTab, Visibility]);

  return (
    <Layout title="Exposure Upload & Approval Dashboard" showButton={false}>
      <div className="mb-6 pt-4">
        <div className="flex space-x-1 border-b border-primary-lg">
          {tabButtons}
        </div>
      </div>

      <div className="transition-opacity duration-300">
        {currentContent}
      </div>
    </Layout>
  );
};

export default ExposureUpload;