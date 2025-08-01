
import Layout from "../../common/Layout";
import { useMemo, useState, useCallback, useEffect } from "react";
import FxConfirmation from "./fxConfirmation";
import FxUploadForm from "./fxUpload";
import TransactionTable from "./pendingForwards";

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


const FxConfirmationPage = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation('Form');

  const tabButtons = useMemo(() => {
    const tabConfig = [
      { id: 'Form', label: 'Fx Confirmation Form', visible: true },
      { id: 'Upload', label: 'Fx Confirmation Upload', visible: true },
      { id: 'add', label: 'Pending Forwards', visible: true },
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
    if (activeTab === 'Form') return <FxConfirmation />;
    if (activeTab === 'Upload') return <FxUploadForm />;
    if (activeTab === 'add') return <TransactionTable />;
    return <div className="p-4 text-gray-600">This tab is not available.</div>;
  }, [activeTab]);

  return (
    <Layout title="Fx Confirmation" showButton={false}>
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

export default FxConfirmationPage;