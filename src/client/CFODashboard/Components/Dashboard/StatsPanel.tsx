import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string;
  bgColor: string;
  drillPath?: string;       
  withFilter?: boolean;
  scrollable?: boolean;
  state?: any;
}

const StatCard = ({ title, value, bgColor, drillPath, withFilter, scrollable, state }: StatCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!drillPath) return;
    if (withFilter) {
      navigate(drillPath, { state });
    } else {
      navigate(drillPath);
    }
  };
  return(
  <div
  onClick={handleClick}
    className={`
      ${bgColor}
      text-secondary-color rounded-2xl shadow-md p-4 w-full relative my-2
      active:scale-95 active:shadow-md
      cursor-pointer hover:scale-105 transition-all duration-200 ease-in-out 
    `}
  >
    {/* Decorative SVG */}
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <svg className="w-full h-full" width="100%" height="100%">
        <defs>
          <pattern
            id="grid-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>

    <div className="relative z-10 flex flex-col h-full pb-6 justify-between">
      <div className="mb-2 flex items-start min-h-[3.5rem]">
        <h2
          className="font-medium text-xl text-left text-white leading-tight break-words line-clamp-2 max-w-[14rem] min-h-[2.7rem]"
          title={title}
        >
          {title}
        </h2>
      </div>
      <div className="flex justify-center mt-2 items-end flex-1">
        <span className="text-3xl md:text-4xl font-bold text-white">{value}</span>
      </div>
    </div>
  </div>
)
};

const StatsPanel = () => {
  const [hedgedExposure, setHedgedExposure] = useState("Loading...");
  const [unhedgedExposure, setUnhedgedExposure] = useState("Loading...");
  const [bankMargin, setBankMargin] = useState("Loading...");
  const [hedgeRatio, setHedgeRatio] = useState("Loading...");
  const [buyForwards, setBuyForwards] = useState("Loading...");
  const [sellForwards, setSellForwards] = useState("Loading...");
  const [avgExposureMaturity, setAvgExposureMaturity] = useState("Loading...");
  const [avgForwardMaturity, setAvgForwardMaturity] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  // Static values (replace with API if available)
  const markToMarketPL = "$0.00M";
  const costOfPremiumPaid = "$0.00M";

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Parallel API calls
        const [
          hedgeRatioRes,
          hedgedRes,
          unhedgedRes,
          bankMarginRes,
          buySellRes,
          waetRes,
          waftRes,
        ] = await Promise.all([
          axios.get(
            "https://backend-slqi.onrender.com/api/forwardDash/hedge-ratio"
          ),
          axios.get(
            "https://backend-slqi.onrender.com/api/forwardDash/total-usd"
          ),
          axios.get(
            "https://backend-slqi.onrender.com/api/exposureUpload/USDsum-headers"
          ),
          axios.get(
            "https://backend-slqi.onrender.com/api/forwardDash/total-bankmargin"
          ),
          axios.get(
            "https://backend-slqi.onrender.com/api/forwardDash/buysell"
          ),
          axios.get("https://backend-slqi.onrender.com/api/forwardDash/waet"),
          axios.get("https://backend-slqi.onrender.com/api/forwardDash/waht"),
        ]);

        // Hedge Ratio
        setHedgeRatio(
          hedgeRatioRes.data?.ratio !== undefined
            ? `${hedgeRatioRes.data.ratio}%`
            : "N/A"
        );

        // Hedged Exposure
        const hedgedVal = (hedgedRes.data?.totalUsd ?? 0) / 1_000_000;
        setHedgedExposure(`$${hedgedVal.toFixed(4)}M`);

        // Unhedged Exposure
        const unhedgedVal = (unhedgedRes.data?.totalUsd ?? 0) / 1_000_000;
        setUnhedgedExposure(`$${(unhedgedVal - hedgedVal).toFixed(2)}M`);

        // Bank Margin
        const bankMarginVal =
          (bankMarginRes.data?.totalBankmargin ?? 0) / 1_000_000;
        setBankMargin(`$${bankMarginVal.toFixed(4)}M`);

        // Buy/Sell Forwards
        setBuyForwards(
          buySellRes.data?.buyForwardsUSD
            ? `$${(
                parseFloat(buySellRes.data.buyForwardsUSD) / 1_000_000
              ).toFixed(2)}M`
            : "N/A"
        );
        setSellForwards(
          buySellRes.data?.sellForwardsUSD
            ? `$${(
                parseFloat(buySellRes.data.sellForwardsUSD) / 1_000_000
              ).toFixed(2)}M`
            : "N/A"
        );

        // Avg Exposure Maturity
        setAvgExposureMaturity(
          waetRes.data?.avgExposureMaturity !== undefined
            ? `${waetRes.data.avgExposureMaturity} days`
            : "N/A"
        );
        // Avg Forward Maturity
        setAvgForwardMaturity(
          waftRes.data?.avgForwardMaturity !== undefined
            ? `${waftRes.data.avgForwardMaturity} days`
            : "N/A"
        );
      } catch (err) {
        setHedgeRatio("Error");
        setHedgedExposure("Error");
        setUnhedgedExposure("Error");
        setBankMargin("Error");
        setBuyForwards("Error");
        setSellForwards("Error");
        setAvgExposureMaturity("Error");
        setAvgForwardMaturity("Error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex flex-wrap gap-3 w-full">
      <div className="flex w-full gap-3">
        <StatCard
          title="Overall Hedge Ratio"
          value={loading ? "Loading..." : hedgeRatio}
          bgColor="bg-gradient-to-tl from-[#4dc9bf] to-[#073f40CC]"

        />
        <StatCard
          title="Total Hedged Exposure"
          value={loading ? "Loading..." : hedgedExposure}
          bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
          drillPath="/linking-screen#summary"
          withFilter={false}
          scrollable={true}
        />
        <StatCard
          title="Total Unhedged Exposure"
          value={loading ? "Loading..." : unhedgedExposure}
          bgColor="bg-gradient-to-br from-[#0d6d69CC] to-[#0a5755B3]"
          drillPath="/linking-screen"
          withFilter={false}
        />
        <StatCard //
          title="Buy Forwards"
          value={loading ? "Loading..." : buyForwards}
          bgColor="bg-gradient-to-tr from-[#40916c] to-[#52b788]"
          drillPath="/fx-confirmation"
          withFilter={true}
          state={{ tag: "Buy" }}
        />
        <StatCard //
          title="Sell Forwards"
          value={loading ? "Loading..." : sellForwards}
          bgColor="bg-gradient-to-tr from-[#80ed99] to-[#5c4d7a]"
          drillPath="/fx-confirmation"
          withFilter={true}
          state={{ tag: "Sell" }}
        />
      </div>

      <div className="flex w-full gap-3">
      <StatCard
        title="Mark-to-Market P&L"
        value={markToMarketPL}
        bgColor="bg-gradient-to-b from-teal-500 to-teal-600"
      />
      <StatCard
        title="Cost of Premium Paid (YTD)"
        value={costOfPremiumPaid}
        bgColor="bg-gradient-to-bl from-green-400 to-green-700"
      />
      <StatCard
        title="Cost of Bank Margin (YTD)"
        value={loading ? "Loading..." : bankMargin}
        bgColor="bg-gradient-to-l from-[#429d5c] to-[#68ba7fe9]"
        drillPath="/fx-confirmation"
        withFilter={false}
      />
      <StatCard //
        title="Avg Exposure Maturity"
        value={loading ? "Loading..." : avgExposureMaturity}
        bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
        drillPath="/exposure-upload"
        withFilter={false}
      />
      <StatCard //
        title="Avg Forward Maturity"
        value={loading ? "Loading..." : avgForwardMaturity}
        bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
        drillPath="/fx-confirmation"
        withFilter={false}
      />
      </div>
    </div>
  );
};

export default StatsPanel;
