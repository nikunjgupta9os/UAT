
import Layout from "../../common/Layout";
import { useMemo, useState, useCallback, useEffect } from "react";
// import FxConfirmation from "./fxConfirmation";
// import FxUploadForm from "./fxUpload";
// import TransactionTable from "./pendingForwards";
import FxBookingForm from "./fxBookingForm";
import FxUploader from "./fxUploader";
import axios from "axios";

const useTabNavigation = (initialTab: string = 'Form') => {
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
  fxForm: boolean;
  fxUpload: boolean;
};


const FxForward = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation('Form');
  
  const [Visibility, setVisibility] = useState<TabVisibility>({
      fxForm: false,
      fxUpload: false,
    });
    const roleName = localStorage.getItem("userRole");
  
  useEffect(() => { 
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionjson",
          { roleName }
        );
        console.log("Permissions response:", response.data);
        const pages = response.data?.pages;
        const userTabs = pages?.["fx-forward-booking"]?.tabs;
        //  console.log(userTabs.allTab.hasAccess);
        if (userTabs) {
          setVisibility({
            fxForm: userTabs.fxForm.hasAccess || false,
            fxUpload: userTabs.fxUpload.hasAccess || false,
            
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    fetchPermissions();
  },[]);

  const tabButtons = useMemo(() => {
    const tabConfig = [
      { id: 'Form', label: 'Fx Forward Booking Form', visible: true },
      { id: 'Upload', label: 'Fx Forward Upload', visible: true },
    //   { id: 'add', label: 'Pending Forwards', visible: true },
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
          <span>{tab.label}</span>
        </button>
      ));
  }, [activeTab, switchTab, isActiveTab]);

  const currentContent = useMemo(() => {
    if (activeTab === 'Form') return <FxBookingForm />;
    if (activeTab === 'Upload') return <FxUploader />;
    // if (activeTab === 'add') return <TransactionTable />;
    return <div className="p-4 text-gray-600">This tab is not available.</div>;
  }, [activeTab]);

  return (
    <Layout title="Fx Forward Booking" showButton={false}>
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

export default FxForward;
