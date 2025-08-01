import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../common/Layout";
import PaymentMethod from "./Paymentmethod";
import RolloverMethod from "./RolloverMethod";
import axios from "axios";

const useTabNavigation = (initialTab: string = "payment") => {
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

const PaymentRollover = () => {
  const { activeTab, switchTab, isActiveTab } = useTabNavigation("payment");
  const navigate = useNavigate();
  const location = useLocation();

  // Access the state passed from previous page
  const { exposure_header_ids, currency, entity, total_open_amount } = location.state || {};

  // You can now use exposure_header_ids, currency, entity in this component
  // For example, log them:
  // useEffect(() => {
  //   console.log("Received from navigation:", {
  //     exposure_header_ids,
  //     currency,
  //     entity,
  //   });
  // }, [exposure_header_ids, currency, entity]);

  const roleName = localStorage.getItem("userRole");

  const [Visibility, setVisibility] = useState({
    paymentTab: true, // Set to true for testing
    rolloverTab: true, // Set to true for testing
    uploadTab: false,
  });

  const handleUploadClick = () => {
    navigate("/exposure/upload");
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionJSON",
          { roleName }
        );

        const pages = response.data?.pages;
        const exposureTabs = pages?.["exposure-management"];

        if (exposureTabs) {
          setVisibility({
            paymentTab: exposureTabs?.paymentTab?.hasAccess || false,
            rolloverTab: exposureTabs?.rolloverTab?.hasAccess || false,
            uploadTab: exposureTabs?.uploadTab?.hasAccess || false,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, [roleName]);

  const TAB_CONFIG = [
    {
      id: "payment",
      label: "Payment Method",
      visibility: Visibility.paymentTab,
    },
    {
      id: "rollover",
      label: "Rollover Method",
      visibility: Visibility.rolloverTab,
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
        <span>{tab.label}</span>
      </button>
    ));
  }, [Visibility, activeTab, switchTab, isActiveTab]);

  const currentContent = useMemo(() => {
    const sharedProps = { exposure_header_ids, currency, entity, total_open_amount };
    switch (activeTab) {
      case "payment":
        return <PaymentMethod {...sharedProps} />;
      case "rollover":
        return <RolloverMethod />;
      default:
        return <PaymentMethod {...sharedProps} />;
    }
  }, [activeTab, exposure_header_ids, currency, entity, total_open_amount]);

  return (
    <Layout
      title="Settlement"
      showButton={Visibility.uploadTab}
      buttonText="Upload Exposure"
      onButtonClick={handleUploadClick}
    >
      <div className="mb-6 pt-4">        
        <div className="flex space-x-1 border-b-2 border-primary-lg">
          {tabButtons}
          
        </div>
      </div>
      <div className="transition-opacity duration-300">
        {currentContent}
      </div>
    </Layout>
  );
};

export default PaymentRollover;

