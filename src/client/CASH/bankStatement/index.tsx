import { useVisibleTabs } from "../Transaction/useVisibleTabs";
import Tabs from "../Transaction/Tab";
import { Contrast, FileEdit, UploadCloud } from "lucide-react";

import Layout from "../../common/Layout";
import Upload from "./upload";
// import Form from "./form";
import ERP from "./erp";

const BankStatementUpload = () => {
  const TAB_CONFIG = [
    // {
    //   id: "Form",
    //   label: "Bank Statement Manual Entry",
    //   icon: FileEdit,
    //   visibility: true,
    // },
    {
      id: "Upload",
      label: "Bank Statement Upload",
      icon: UploadCloud,
      visibility: true,
    },
    {
      id: "add",
      label: "Bank Statement ERP",
      icon: Contrast,
      visibility: true, 
    },
  ];

  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    "Upload" 
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
    //   case "Form":
    //     currentContent = <Form />;
    //     break;
      case "Upload":
        currentContent = <Upload />;
        break;
      case "add":
        currentContent = <ERP />;
        break;
    }
  }

  return (
    <Layout title="Bank Statement Upload" showButton={false}>
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

export default BankStatementUpload;
