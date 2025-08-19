import React, { useState } from "react";
import ExposureDetails from "./ExposuresDetails.tsx";
import ForwardsDetails from "./ForwardsDetails.tsx";

const DetailedViews: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"exposure" | "forwards">("exposure");
  const [collapsedExposure, setCollapsedExposure] = useState(true); 
  const [collapsedForwards, setCollapsedForwards] = useState(true);

  const handleTabChange = (tab: "exposure" | "forwards") => {
    setActiveTab(tab);
    if (tab === "exposure") {
      setCollapsedExposure(false); 
    } else {
      setCollapsedForwards(false);
    }
  };

  return (
    <div className="mt-10 border border-border shadow">
      <div className="flex justify-between items-center border-b border-border px-4 py-2 bg-secondary-color">
        <div className="space-x-2">
          <button
            onClick={() => handleTabChange("exposure")}
            className={`px-4 py-2 font-semibold ${
              activeTab === "exposure" ? "bg-primary text-white" : "bg-primary-md text-primary-lt"
            } rounded`}
          >
            Existing Exposure Details
          </button>
          <button
            onClick={() => handleTabChange("forwards")}
            className={`px-4 py-2 font-semibold ${
              activeTab === "forwards" ? "bg-primary text-white" : "bg-primary-md text-primary-lt"
            } rounded`}
          >
            Detailed Forwards Booked
          </button>
        </div>

        <button
          onClick={() =>
            activeTab === "exposure"
              ? setCollapsedExposure((prev) => !prev)
              : setCollapsedForwards((prev) => !prev)
          }
          className="px-4 py-2 font-semibold bg-primary text-white rounded-md"
        >
          {activeTab === "exposure"
            ? collapsedExposure ? "Show" : "Hide"
            : collapsedForwards ? "Show" : "Hide"} Detailed View
        </button>
      </div>

      {activeTab === "exposure" && !collapsedExposure && <ExposureDetails />}
      {activeTab === "forwards" && !collapsedForwards && <ForwardsDetails />}
    </div>
  );
};

export default DetailedViews;
