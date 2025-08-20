import React, { useState, useEffect } from "react";
import axios from "axios";
import { Handshake } from "lucide-react";

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
        // console.error("Failed to fetch business unit data:", err);
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


  return (
    <div className="bg-gradient-to-bl from-[#76c893] to-[#02c39a] rounded-xl shadow-sm border border-primary-lg overflow-hidden pb-4">
      <div className="absolute inset-0 opacity-10">
        <svg
          className="w-full h-full"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="currency-grid-pattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#currency-grid-pattern)" />
        </svg>
      </div>
      <div className="flex items-center pt-4 pl-6 gap-2 mb-4">
        <div className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-lg border border-emerald-400/30 shadow-md flex items-center justify-center">
          <Handshake className="w-8 h-8 text-white" />
        </div>
        <div className="text-left ">
          <h2 className="text-xl font-semibold text-white">
            Business Unit Exposure
          </h2>
          <p className="text-white text-md">
            Net exposure and hedging status by business unit
          </p>
        </div>
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
            className={`border border-white/30 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-900/20`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
              <div className="w-3 h-3 bg-[#7FEB98] rounded-full mr-2"></div>
              <h4 className="font-medium text-lg text-white">{unit.name}</h4>
              </div>
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
                  className="flex justify-between items-center p-2 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/30 hover:bg-white/30"
                >
                  <div className="flex items-center">
                    <span
                      className={`w-3 h-3 rounded-full mr-2 ${getCurrencyColor(
                        currency.code
                      )}`}
                    ></span>
                    <span className="text-md text-white font-medium">
                      <span className="text-white pr-2">{currency.code}</span> :{" "}
                      <span className="text-md ml-2 text-white font-medium">
                        {currency.amount}
                      </span>
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
    </div>
  );
};

export default BusinessUnitExposureCard;
