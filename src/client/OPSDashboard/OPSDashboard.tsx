import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../common/Layout";

type CardData = {
  title: string;
  subtitle?: string;
  value: string;
  description: string;
};

type GridCardItem = {
  label: string;
  value: string;
  subvalue?: string;
};

type GridCardData = {
  title: string;
  items: GridCardItem[];
};

type CurrencyPosition = {
  currency: string;
  value: number;
  color: string;
};

type MaturitySummaryItem = {
  label: string;
  value: string;
};

const TreasuryDashboard: React.FC = () => {
  const [unhedgedValue, setUnhedgedValue] = useState<number | null>(null);
  const [maturityExpiryCount, setMaturityExpiryCount] = useState<number | null>(
    null
  );
  const [maturitySummary, setMaturitySummary] = useState<MaturitySummaryItem[]>(
    []
  );
  const [currencyPositions, setCurrencyPositions] = useState<
    CurrencyPosition[]
  >([]);
  const [activeForwards, setActiveForwards] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Static card data
  const primaryCards: CardData[] = [
    {
      title: "Exposures Requiring Attention",
      subtitle: "(Next 7 Days)",
      value:
        maturityExpiryCount !== null
          ? maturityExpiryCount.toString()
          : "Loading...",
      description: "Unhedged & Approaching Maturity",
    },
    {
      title: "Ready for Settlement",
      value: "2",
      description: "Trades Maturing Today",
    },
    {
      title: "Overall Unhedged Value",
      value:
        unhedgedValue !== null ? `$${unhedgedValue.toFixed(2)}M` : "Loading...",
      description: "Potential Spot Exposure",
    },
    {
      title: "Pending Settlements",
      subtitle: "(Today)",
      value: "3",
      description: "Awaiting Confirmation",
    },
    {
      title: "Daily Traded Volume",
      value: "$85.5M",
      description: "YTD Avg $78.1M",
    },
    {
      title: "Number of Active Forwards",
      value: activeForwards !== null ? activeForwards.toString() : "Loading...",
      description: "Avg force 60 days",
    },
  ];

  const gridCards: GridCardData[] = [
    {
      title: "Upcoming Exposure Maturities",
      items:
        maturitySummary.length > 0
          ? maturitySummary.map((item) => ({
              label: item.label,
              value: item.value,
              subvalue: item.label.includes("7 Days")
                ? "(3 Unhedged)"
                : item.label.includes("30 Days")
                ? "(5 Unhedged)"
                : undefined,
            }))
          : [
              {
                label: "Next 7 Days",
                value: "Loading...",
                subvalue: "(3 Unhedged)",
              },
              {
                label: "Next 30 Days",
                value: "Loading...",
                subvalue: "(5 Unhedged)",
              },
              { label: "Total Upcoming", value: "Loading..." },
            ],
    },
    {
      title: "Trades Maturing Soon",
      items: [
        { label: "Today", value: "USD/EUR $15M", subvalue: "(Pending)" },
        { label: "Tomorrow", value: "GBP/USD $8M", subvalue: "(Confirmed)" },
        { label: "Next Week", value: "JPY/USD $22M", subvalue: "(Issues)" },
      ],
    },
    {
      title: "Settlement Performance (Daily)",
      items: [
        { label: "Confirmed Settlements", value: "10" },
        { label: "Pending Settlements", value: "3" },
        { label: "Failed Settlements (24h)", value: "1" },
        { label: "Auto-Reconciled", value: "95%" },
      ],
    },
    {
      title: "Recent Hedge Effectiveness",
      items: [
        { label: "Avg. Slippage (Last 24h)", value: "-0.0003" },
        { label: "Hedge Success Rate", value: "92%" },
        { label: "Unrealized P&L (Hedging)", value: "+$0.15M" },
      ],
    },
  ];

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Currency positions
      axios
        .get(
          "https://backend-slqi.onrender.com/api/exposureUpload/top-currencies-headers"
        )
        .then((res) => {
          const colorMap: Record<string, string> = {
            "bg-green-400": "bg-green-400",
            "bg-blue-400": "bg-blue-400",
            "bg-yellow-400": "bg-yellow-400",
            "bg-red-400": "bg-red-400",
            "bg-purple-400": "bg-purple-400",
            "bg-orange-400": "bg-orange-400",
            "bg-teal-400": "bg-teal-400",
            "bg-pink-400": "bg-pink-400",
            "bg-indigo-400": "bg-indigo-400",
          };

          const mappedPositions = res.data.map((item: any) => ({
            currency: item.currency,
            value: item.value / 10000, // Convert to millions
            color: colorMap[item.color] || "bg-gray-400",
          }));
          setCurrencyPositions(mappedPositions);
        })
        .catch((err) => {
          console.error("Failed to fetch currency positions:", err);
        });

      // Unhedged exposure
      axios
        .get(
          "https://backend-slqi.onrender.com/api/exposureUpload/USDsum-headers"
        )
        .then((res) => {
          let usdValue = (res.data.totalUsd ?? 0) / 1000000;
          usdValue = usdValue - 1.2301; // TODO: Replace with dynamic hedged value if available
          setUnhedgedValue(usdValue);
        })
        .catch((err) => {
          console.error("Failed to fetch unhedged exposure:", err);
          setUnhedgedValue(0);
        });

      // Maturity expiry count
      axios
        .get(
          "https://backend-slqi.onrender.com/api/exposureUpload/maturity-expiry-count-7days-headers"
        )
        .then((res) => {
          setMaturityExpiryCount(res.data.value);
        })
        .catch((err) => {
          console.error("Failed to fetch maturity expiry count:", err);
          setMaturityExpiryCount(0);
        });

      // Maturity expiry summary
      axios
        .get(
          "https://backend-slqi.onrender.com/api/exposureUpload/maturity-expiry-summary-headers"
        )
        .then((res) => {
          setMaturitySummary(res.data);
        })
        .catch((err) => {
          console.error("Failed to fetch maturity expiry summary:", err);
          setMaturitySummary([]);
        });

      // Active forwards
      axios
        .get(
          "https://backend-slqi.onrender.com/api/forwardDash/active-forwards"
        )
        .then((res) => {
          setActiveForwards(Number(res.data.ActiveForward ?? 0));
        })
        .catch((err) => {
          console.error("Failed to fetch active forwards:", err);
          setActiveForwards(0);
        })
        .finally(() => {
          setLoading(false); // Once last request finishes
        });
    };

    fetchData();
  }, []);

  // Helper functions
  const formatToMillions = (value: number): string => {
    return `${value >= 0 ? "+" : ""}${Math.abs(value).toFixed(1)}M`;
  };

  const calculateMaxValue = (positions: CurrencyPosition[]): number => {
    return Math.max(...positions.map((item) => Math.abs(item.value)), 1);
  };

  // Component rendering
  const renderPrimaryCard = (card: CardData) => (
    <div
      key={card.title}
      className="bg-secondary-color rounded-xl p-6 border border-primary-lt shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
    >
      <div className="flex flex-col space-y-3">
        <h2 className="text-lg mx-auto font-semibold text-secondary-text-dark underline underline-offset-4 text-center">
          {card.title}
          {card.subtitle && (
            <span className="text-sm text-primary-lt ml-1 block mt-1">
              {card.subtitle}
            </span>
          )}
        </h2>
        <div className="flex items-end justify-center pt-4 space-x-2">
          <p className="text-4xl font-bold text-primary">{card.value}</p>
          <p className="text-sm text-secondary-text">{card.description}</p>
        </div>
      </div>
    </div>
  );

  const renderGridCard = (card: GridCardData) => (
    <div
      key={card.title}
      className="bg-secondary-color rounded-xl p-6 border border-primary-lt shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
    >
      <h2 className="text-lg font-semibold text-secondary-text-dark pb-3 border-b border-primary-lt mb-4">
        {card.title}
      </h2>
      <div className="space-y-3">
        {card.items.map((item) => (
          <div
            key={item.label}
            className="flex justify-between items-center py-1"
          >
            <span className="text-sm text-secondary-text">{item.label}</span>
            <div className="text-right">
              <span className="font-medium text-primary">{item.value}</span>
              {item.subvalue && (
                <span className="text-xs text-primary-lt ml-2 block">
                  {item.subvalue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrencyPosition = (
    position: CurrencyPosition,
    maxValue: number
  ) => {
    const heightPercentage = (Math.abs(position.value) / maxValue) * 70;

    return (
      <div key={position.currency} className="flex flex-col items-center w-12">
        <div
          className={`w-6 ${position.color} rounded-t-sm transition-all duration-300`}
          style={{ height: `${heightPercentage}px` }}
        />
        <div className="mt-1 text-xs font-medium text-secondary-text truncate w-full text-center">
          {position.currency}
        </div>
        <div
          className={`text-[10px] mt-1 font-medium ${
            position.value >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatToMillions(position.value)}
        </div>
      </div>
    );
  };

  return (
    <Layout title="Operations Dashboard">
      <div className="p-6 bg-secondary-color-lt shadow-sm border border-primary rounded-xl min-h-screen">
        {/* Primary Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {primaryCards.map(renderPrimaryCard)}
        </div>

        {/* Grid Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gridCards.map(renderGridCard)}
        </div>

        {/* Currency Positions Section */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="bg-secondary-color hover:scale-[1.02] hover:shadow-lg transition-transform rounded-lg shadow-md p-4 border border-primary-lt ">
            <h2 className="text-lg font-semibold text-secondary-text-dark mb-4">
              Top {currencyPositions.length} Currency Net Positions (in
              millions)
            </h2>

            {loading ? (
              <p className="text-center text-secondary-text-dark py-2">
                Loading...
              </p>
            ) : error ? (
              <p className="text-center text-red-500 py-2">{error}</p>
            ) : (
              <div className="flex items-end justify-center gap-4 h-24 px-4">
                {currencyPositions.map((position) =>
                  renderCurrencyPosition(
                    position,
                    calculateMaxValue(currencyPositions)
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TreasuryDashboard;
