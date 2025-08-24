import { useVisibleTabs } from "./useVisibleTabs";
import Tabs from "./Tab";
import { Contrast, FileEdit, UploadCloud } from "lucide-react";

import Layout from "../../common/Layout";
import Upload from "./Upload";
import Form from "./Form";
import ERP from "./Erp";

const TransactionScreen = () => {
  const TAB_CONFIG = [
    {
      id: "Form",
      label: "Transaction Manual Entry",
      icon: FileEdit,
      visibility: true,
    },
    {
      id: "Upload",
      label: "Transaction Upload",
      icon: UploadCloud,
      visibility: true,
    },
    {
      id: "add",
      label: "Transaction ERP",
      icon: Contrast,
      visibility: true, 
    },
  ];

  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    "Form" 
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
      case "Form":
        currentContent = <Form />;
        break;
      case "Upload":
        currentContent = <Upload />;
        break;
      case "add":
        currentContent = <ERP />;
        break;
    }
  }

  return (
    <Layout title="Cash Transaction Upload" showButton={false}>
      <div className="mb-6 pt-4">
        <Tabs
          tabs={TAB_CONFIG}
          activeTab={activeTab}
          switchTab={switchTab}
          isActiveTab={isActiveTab}
        />
      </div>
      <div className="transition-opacity duration-300">{currentContent}</div>
    </Layout>
  );
};

export default TransactionScreen;
