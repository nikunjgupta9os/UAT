// import './App.css'
// import React from "react";
import Layout from "../common/Layout";
import StatsPanel from "./Components/Dashboard/StatsPanel";
// import DashboardBuilder from "./Components/Dashboard/DashboardBuilder";
import MultiCurrencyDashboard from "./Components/currencyDashboard/MultiCurrencyDashboard";
import AlertDashboard from "./Components/alertDashboard/DueWarning";
// import DraggableDashboardBuilder from "./Components/DraggableDashboard/DraggableDashboardBuilder";
import DashboardDemo from "./Components/DashboardDemo/DashboardDemo";
import CurrencyExposure from "./Components/NetExposure/NetCurrencyExposure";
import FinancialDashboard from "./Components/StatesDashboard/StatesDashboard";
import BusinessUnitExposureCard from "./Components/BusinessUnitExposureCard/BusinessUnitExposureCard";
import RecentTradingActivityCard from "./Components/TradingOverviewCards/RecentTradingActivityCard";
import ForwardMaturityAnalysisCard from "./Components/TradingOverviewCards/ForwardMaturityAnalysisCard";

function CFODashboard() {
  return (
    <Layout title="CFO Dashboard">
      <div className="text-center py-4">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col ">
            <div>
              <StatsPanel />
            </div>
            <div className="mt-4">
              <FinancialDashboard />
            </div>
            <div className="grid grid-cols-[3.5fr_1fr] gap-6 mt-8">
              <div className="">
                <BusinessUnitExposureCard />
              </div>
              <div className="">
                <CurrencyExposure />
              </div>
            </div>
            <div className="mt-8">
              <ForwardMaturityAnalysisCard />
            </div>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="">
                <RecentTradingActivityCard />
              </div>
              <div className="">
                {/* <AlertDashboard /> */}
              </div>
            </div>

            {/* <div className="grid grid-cols-[2fr_1fr] gap-6 mt-6">
              <div className="">
                <DashboardDemo />
              </div>
              <div className="">
                <MultiCurrencyDashboard />
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CFODashboard;
