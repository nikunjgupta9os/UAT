import { useState, useEffect } from "react";
import axios from "axios";


interface StatCardProps {
  title: string;
  value: string;
  bgColor: string;
}

const StatCard = ({ title, value, bgColor }: StatCardProps) => (
  <div
    className={`
      ${bgColor}
      text-secondary-color rounded-2xl shadow-md p-4 w-full relative my-2
      transition-transform duration-200
      hover:scale-100 hover:shadow-xl
      active:scale-95 active:shadow-md
      cursor-pointer
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
        <span className="text-4xl font-bold text-white">{value}</span>
      </div>
    </div>
  </div>
);

const StatsPanel = () => {
  const [hedgedExposure, setHedgedExposure] = useState("Loading...");
  const [unhedgedExposure, setUnhedgedExposure] = useState("Loading...");
  const [bankMargin, setBankMargin] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const[hedgeratio,setHedgeRatio] = useState(true);

  useEffect(() => {
    const fetchExposures = async () => {
      setLoading(true);

      // try {
      //   const [unhedgedRes, hedgedRes, bankMarginRes] = await Promise.all([
      //     axios.get("https://backend-slqi.onrender.com/api/exposureUpload/USDsum-headers"),
      //     axios.get("https://backend-slqi.onrender.com/api/forwardDash/total-usd"),
      //     axios.get("https://backend-slqi.onrender.com/api/forwardDash/total-bankmargin"),
      //   ]);

      //   const unhedgedVal = (unhedgedRes.data?.totalUsd ?? 0) / 1_000_000;
      //   const hedgedVal = (hedgedRes.data?.totalUsd ?? 0) / 1_000_000;
      //   const bankMarginVal = (bankMarginRes.data?.totalBankmargin ?? 0) / 1_000_000;

      //   setHedgedExposure(`$${hedgedVal.toFixed(4)}M`);
      //   setUnhedgedExposure(`$${(unhedgedVal - hedgedVal).toFixed(2)}M`);
      //   setBankMargin(`$${bankMarginVal.toFixed(4)}M`);
      // } catch (err) {
      //   console.error("Failed to fetch exposures:", err);
      //   setHedgedExposure("Error");
      //   setUnhedgedExposure("Error");
      //   setBankMargin("Error");
      // } finally {
      //   setLoading(false);
      // }

      // Fetch Unhedged
      axios.get("https://backend-slqi.onrender.com/api/exposureUpload/USDsum-headers")
        .then((res) => {
          const rawValue = res.data?.totalUsd ?? 0;
          const processed = rawValue / 1000000;
          setUnhedgedExposure(`$${processed.toFixed(2)}M`);
        })
        .catch((err) => {
          console.error("Failed to fetch unhedged exposures:", err);
          setUnhedgedExposure("Error");
        });

      // Fetch Hedged
      axios.get("https://backend-slqi.onrender.com/api/forwardDash/total-usd")
        .then((res) => {
          const hedgedRaw = res.data?.totalUsd ?? 0;
          const totalHedgedExposure = hedgedRaw / 1000000;
          setHedgedExposure(`$${totalHedgedExposure.toFixed(4)}M`);
        })
        .catch((err) => {
          console.error("Failed to fetch hedged exposures:", err);
          setHedgedExposure("Error");
        });

      // Fetch Bank Margin
      axios.get("https://backend-slqi.onrender.com/api/forwardDash/total-bankmargin")
        .then((res) => {
          const bankMarginRaw = res.data?.totalBankmargin ?? 0;
          setBankMargin(`$${bankMarginRaw.toFixed(4)}M`);
        })
        .catch((err) => {
          console.error("Failed to fetch bank margin:", err);
          setBankMargin("Error");
        })
        .finally(() => {
          setLoading(false);
        });
      axios.get("https://backend-slqi.onrender.com/api/forwardDash/hedge-ratio")
        .then((res) => {
          const hedgeratio = res.data?.ratio ?? 0;
          setHedgeRatio(hedgeratio);
        })
        .catch((err) => {
          console.error("Failed to fetch bank margin:", err);
          setHedgeRatio("Error");
        })
        .finally(() => {
          setLoading(false);
        });
      
    };

    fetchExposures();
  }, []);

  return (
    <div className="grid grid-cols-5 gap-x-3 w-full">
{/*       <StatCard
        title="Hedging Effectiveness Ratio"
        value="87.3%"
        bgColor="bg-gradient-to-tr from-[#1299909E] to-[#129990]"
      /> */}
      <StatCard
        title="Total Hedged Exposure"
        value={loading ? "Loading..." : hedgedExposure}
        bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
      />
      <StatCard
        title="Total Unhedged Exposure"
        value={loading ? "Loading..." : unhedgedExposure}
        bgColor="bg-gradient-to-br from-[#0d6d69CC] to-[#0a5755B3]"
      />
      <StatCard
        title="Mark-to-Market P&L"
        value="$3.1M"
        bgColor="bg-gradient-to-b from-teal-500 to-teal-600"
      />
      <StatCard
        title="Cost of Premium Paid (YTD)"
        value="$1.47M"
        bgColor="bg-gradient-to-bl from-green-400 to-green-700"
      />
      <StatCard
        title="Cost of Bank Margin (YTD)"
        value={loading ? "Loading..." : bankMargin}
        bgColor="bg-gradient-to-l from-[#429d5c] to-[#68ba7fe9]"
      />
      <StatCard
        title="Overall Hedge Ratio"
        value={loading?"Loading..": hedgeratio}
        bgColor="bg-gradient-to-tl from-[#4dc9bf] to-[#073f40CC]"
      />
    </div>
  );
};

export default StatsPanel;
