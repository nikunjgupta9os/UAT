import React, { useState, useEffect } from "react";
import axios from "axios";

type CurrencyData = {
  code: string;
  amount: string;
  hedgeRatio?: number;
};

type BusinessUnit = {
  name: string;
  total: string;
  currencies: CurrencyData[];
};

const BusinessUnitExposureCard: React.FC = () => {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessUnitData = async () => {
      try {
        const res = await axios.get(
          "https://backend-slqi.onrender.com/api/exposureUpload/business-unit-currency-summary-headers"
        );

        setBusinessUnits(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch business unit data:", err);
        setError("Failed to load business unit data");
        setLoading(false);
      }
    };

    fetchBusinessUnitData();
  }, []);

  const getHedgeRatioColor = (ratio?: number) => {
    if (!ratio) return "bg-gray-100 text-gray-600";
    return ratio < 50
      ? "bg-red-50 text-red-600"
      : ratio > 75
      ? "bg-green-50 text-green-600"
      : "bg-yellow-50 text-yellow-600";
  };

  const getCurrencyColor = (code: string) => {
    const colors: Record<string, string> = {
      USD: "text-red-600", // Bright red
      EUR: "text-yellow-500", // Bright yellow
      GBP: "text-indigo-600", // Deep blue-purple
      CNY: "text-orange-500", // Bold orange
      JPY: "text-pink-600", // Bold pink
      CAD: "text-green-600", // Vivid green
      CHF: "text-teal-600", // Strong teal
      AUD: "text-emerald-600", // Bold emerald
      INR: "text-sky-600",
    };
    return colors[code] || "text-gray-600";
  };

  const getCardGradient = (index: number) => {
    const gradients = [
      "bg-gradient-to-br from-[#129990CC] to-teal-500",
      "bg-gradient-to-tl from-[#129990CC] to-teal-500",
      "bg-gradient-to-b from-[#129990CC] to-teal-500",
      "bg-gradient-to-t from-[#129990CC] to-teal-500",
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-primary-lg p-6 text-center">
        <p>Loading business unit data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-primary-lg p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-bl from-[#b2ffe2] to-[#cdffec] rounded-xl shadow-sm border border-primary-lg overflow-hidden">
      <div className="bg-gradient-to-br from-[#488987] to-[#4CC2B9] px-6 py-4 border-b border-primary-lt">
        <h3 className="text-xl font-semibold text-white">
          Business Unit Exposure
        </h3>
        <p className="text-md text-white">
          Net exposure and hedging status by business unit
        </p>
      </div>

      <div
        className="grid m-2 grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 p-4"
        style={{
          maxHeight: businessUnits.length > 4 ? "520px" : "auto",
          overflowY: businessUnits.length > 4 ? "auto" : "visible",
        }}
      >
        {businessUnits.map((unit, index) => (
          <div
            key={unit.name}
            className={`border border-primary-lg rounded-lg p-4 hover:shadow-md transition-shadow ${getCardGradient(
              index
            )}`}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-lg text-white">
                {unit.name}
              </h4>
              <span className="text-2xl font-bold text-white">
                {unit.total}
              </span>
            </div>
            <div
              className="space-y-2"
              style={{
                maxHeight: unit.currencies.length > 4 ? "190px" : "auto", // 4 rows * ~45px each
                overflowY: unit.currencies.length > 4 ? "auto" : "visible",
              }}
            >
              {unit.currencies.map((currency) => (
                <div
                  key={`${unit.name}-${currency.code}`}
                  className="flex justify-between items-center p-2 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/30"
                >
                  <div className="flex items-center">
                    <span
                      className={`w-3 h-3 rounded-full mr-2 ${getCurrencyColor(
                        currency.code
                      )} bg-opacity-30`}
                    ></span>
                    <span className="text-md text-white font-medium">
                      <span className="text-white pr-2">
                        {currency.code}
                      </span>{" "}
                      : <span className="text-md ml-2 text-white font-medium">{currency.amount}</span>
                    </span>
                  </div>
                  {currency.hedgeRatio && (
                    <span
                      className={`text-md mr-2 py-1 rounded-full ${getHedgeRatioColor(
                        currency.hedgeRatio
                      )}`}
                    >
                      {currency.hedgeRatio}% hedged
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Card Footer */}
      <div className="bg-gradient-to-br from-[#488987] to-[#4CC2B9] px-6 py-3 text-xs text-white border-t border-primary-lg">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default BusinessUnitExposureCard;
