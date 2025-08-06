import Layout from "../../common/Layout";
import { useMemo, useState, useCallback, useEffect } from "react";
import AccountingVoucher from "./output";
import CommunicationLetter from "./communicationLetter";
const TAB_KEY = "fx-output-tab";

const useTabNavigation = (initialTab: string = "AccountingVoucher") => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(TAB_KEY) || initialTab;
  });

  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_KEY, tab);
  }, []);

  const isActiveTab = useCallback(
    (tab: string) => activeTab === tab,
    [activeTab]
  );

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(TAB_KEY);
      if (stored && stored !== activeTab) setActiveTab(stored);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [activeTab]);

  return { activeTab, switchTab, isActiveTab };
};

const OutputTabs = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation("AccountingVoucher");

  const tabButtons = useMemo(
    () => [
      { id: "AccountingVoucher", label: "Accounting Voucher (IND AS)" },
      { id: "CommunicationLetter", label: "Communication Letter" },
    ].map((tab) => (
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
    )),
    [isActiveTab, switchTab]
  );

  return (
    <Layout title="Outputs: Generated Documents & Vouchers">
      <div className="mb-6 pt-4">
        <div className="flex space-x-1 border-b border-primary-lg">
          {tabButtons}
        </div>
      </div>
      <div className="transition-opacity duration-300">
        {activeTab === "AccountingVoucher" && <AccountingVoucher />}
        {activeTab === "CommunicationLetter" && <CommunicationLetter />}
      </div>
    </Layout>
  );
};

export default OutputTabs;