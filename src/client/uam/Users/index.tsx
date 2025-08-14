

import { useMemo, useState, useEffect, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../common/Layout";
import AllUser from "./AllUser";
import AwaitingUser from "./AwaitingUser";
import ApprovedUser from "./ApprovedUser";
import axios from "axios";
import { Users, CheckCircle2, Clock, Contrast } from "lucide-react";




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

const User = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation("all");
  const navigate = useNavigate();
  const roleName = localStorage.getItem("userRole");

  const [Visibility, setVisibility] = useState<TabVisibility>({
    allTab: false,
    uploadTab: false,
    pendingTab: false,
  });

  const PageChange = () => {
    navigate("/user/create");
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionjson",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["user-creation"];

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
      label: "All Users",
      icon: Users,
      visibility: Visibility.allTab,
    },
    {
      id: "approved",
      label: "Approved Users",
      icon: CheckCircle2,
      visibility: true, // fallback if needed
    },
    {
      id: "Awaiting",
      label: "Awaiting Users",
      icon: Contrast,
      visibility: Visibility.pendingTab,
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
        return <AllUser />;
      case "approved":
        return <ApprovedUser />;
      case "Awaiting":
        return <AwaitingUser />;
      default:
        return <AllUser />;
    }
  }, [activeTab]);

  return (
    <Layout
      title="Users"
      showButton={Visibility.uploadTab}
      buttonText="Create User"
      onButtonClick={PageChange}
    >
      <div className="mb-6 pt-4">
        <div className="flex space-x-1 border-b-2 border-primary-lg">{tabButtons}</div>
      </div>
      <div className="transition-opacity duration-300">{currentContent}</div>
    </Layout>
  );
};

export default User;