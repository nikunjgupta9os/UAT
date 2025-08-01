// import './App.css'
// import React from "react";
import Layout from "../common/Layout";
import DraggableDashboardBuilder from "./DraggableDashboard/DraggableDashboardBuilder";

function CFODashboardBuilder() {
  return (
    <Layout title="CFO Dashboard Builder" >
      <div className="text-center">
          <DraggableDashboardBuilder />
        </div>
    </Layout>
  );
}

export default CFODashboardBuilder;
