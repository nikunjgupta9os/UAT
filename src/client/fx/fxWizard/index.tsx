import Layout from "../../common/Layout";
import { useMemo, useState, useCallback, useEffect } from "react";
import FxCancellation from "./fxCancellation";
import FxRollover from "./fxRollover";

const TAB_KEY = "fx-wizard-active-tab";

const useTabNavigation = (initialTab: string = 'Cancellation') => {
  const [activeTab, setActiveTab] = useState(() => {
    // Try to get from localStorage, fallback to initialTab
    return localStorage.getItem(TAB_KEY) || initialTab;
  });

  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_KEY, tab);
  }, []);

  const isActiveTab = useCallback((tab: string) => {
    return activeTab === tab;
  }, [activeTab]);

  // Keep localStorage in sync if changed elsewhere
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(TAB_KEY);
      if (stored && stored !== activeTab) setActiveTab(stored);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [activeTab]);

  return {
    activeTab,
    switchTab,
    isActiveTab
  };
};

const FxCancellationRollover = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation('Cancellation');

  const tabButtons = useMemo(() => {
    const tabConfig = [
      { id: 'Cancellation', label: 'Cancellation', visible: true },
      { id: 'Rollover', label: 'Rollover', visible: true },
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
    if (activeTab === 'Cancellation') return <FxCancellation />;
    if (activeTab === 'Rollover') return <FxRollover />;
    return <div className="p-4 text-gray-600">This tab is not available.</div>;
  }, [activeTab]);

  return (
    <Layout
      title="FX Cancellation & Rollover Wizard"
      showButton={false}
    >
      <div className="mb-12 pt-4">
        <div className="flex space-x-1 border-b border-primary-lg">
          {tabButtons}
        </div>
      </div>

      <div className="transition-opacity duration-300 pb-6">
        {currentContent}
      </div>
    </Layout>
  );
};

export default FxCancellationRollover;