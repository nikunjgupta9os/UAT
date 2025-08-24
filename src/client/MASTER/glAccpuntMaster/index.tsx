import { useVisibleTabs } from "../../CASH/Transaction/useVisibleTabs.tsx";
import Tabs from "../../CASH/Transaction/Tab.tsx";
import { Contrast, FileEdit, UploadCloud } from "lucide-react";

import Layout from "../../common/Layout.tsx";
import Upload from "./upload.tsx";
import Form from "./form.tsx";
import ERP from "./erp.tsx";

const GLMasterScreen = () => {
  const TAB_CONFIG = [
    {
      id: "Form",
      label: "Manual Entry Form",
      icon: FileEdit,
      visibility: true,
    },
    {
      id: "Upload",
      label: "GL Account Upload",
      icon: UploadCloud,
      visibility: true,
    },
    {
      id: "add",
      label: "GL Account ERP",
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
    <Layout title="GL Account Master">
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

export default GLMasterScreen;
