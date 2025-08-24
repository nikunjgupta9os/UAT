import { useState, useCallback, useEffect } from "react";

export type TabConfig = {
  id: string;
  label: string;
  icon?: React.ElementType;
  visibility: boolean;
};

export const useVisibleTabs = (
  tabs: TabConfig[],
  initialTab: string
) => {
  
  const storedTab = localStorage.getItem("activeTab");
  const firstVisible = tabs.find((t) => t.visibility);

  const [activeTab, setActiveTab] = useState<string>(
    storedTab && tabs.some((t) => t.id === storedTab && t.visibility)
      ? storedTab
      : firstVisible
      ? firstVisible.id
      : initialTab
  );

  // Keep visible tabs handy
  const visibleTabs = tabs.filter((t) => t.visibility);

  const switchTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem("activeTab", tabId); 
  }, []);

  const isActiveTab = useCallback(
    (tabId: string) => activeTab === tabId,
    [activeTab]
  );


  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === activeTab)) {
      const fallback = visibleTabs[0]?.id || initialTab;
      setActiveTab(fallback);
      localStorage.setItem("activeTab", fallback);
    }
  }, [activeTab, visibleTabs, initialTab]);

  useEffect(() => {
  return () => {
    localStorage.setItem("activeTab", initialTab);
  };
}, [initialTab]);

  return { activeTab, visibleTabs, switchTab, isActiveTab };
};
