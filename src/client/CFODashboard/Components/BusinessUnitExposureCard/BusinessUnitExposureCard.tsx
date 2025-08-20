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
      } catch (err) {
        setError("Failed to load business unit data");
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessUnitData();
  }, []);

  const getHedgeRatioColor = (ratio?: number) => {
    if (!ratio) return "bg-gray-200 text-gray-600";
    if (ratio < 50) return "bg-red-100 text-red-700";
    if (ratio > 75) return "bg-green-100 text-green-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getCurrencyColor = (code: string) => {
    const colors: Record<string, string> = {
      USD: "bg-red-500",
      EUR: "bg-yellow-400",
      GBP: "bg-indigo-500",
      CNY: "bg-orange-500",
      JPY: "bg-pink-500",
      CAD: "bg-green-500",
      CHF: "bg-teal-500",
      AUD: "bg-emerald-500",
      INR: "bg-sky-500",
    };
    return colors[code] || "bg-gray-400";
  };

  return (
    <div className="bg-gradient-to-bl from-[#76c893] to-[#02c39a] rounded-xl shadow-md border border-emerald-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5">
        <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-lg flex items-center justify-center shadow">
          <Handshake className="w-7 h-7 text-white" />
        </div>
        <div className="text-left">
          <h2 className="text-xl font-semibold text-white">Business Unit Exposure</h2>
          <p className="text-md text-white/90">
            Net exposure and hedging status by business unit
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 ${
          businessUnits.length > 4 ? "max-h-[520px] overflow-y-auto" : ""
        }`}
      >
        {loading && <p className="text-white">Loading...</p>}
        {error && <p className="text-red-200">{error}</p>}

        {!loading &&
          !error &&
          businessUnits.map((unit) => (
            <div
              key={unit.name}
              className="border border-white/30 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-900/20"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#7FEB98] rounded-full"></div>
                  <h4 className="text-lg font-medium text-white">{unit.name}</h4>
                </div>
                <span className="text-xl font-bold text-white">{unit.total}</span>
              </div>

              <div
                className={`space-y-2 py-6 ${
                  unit.currencies.length > 4 ? "max-h-[180px] overflow-y-auto pr-1" : ""
                }`}
              >
                {unit.currencies.map((currency) => (
                  <div
                    key={`${unit.name}-${currency.code}`}
                    className="flex justify-between items-center p-2 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/30 hover:bg-white/30 hover:scale-[1.01] transition-all duration-200 ease-in-out"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white">
                        {currency.code}:{" "}
                        <span className="font-medium">{currency.amount}</span>
                      </span>
                    </div>
                    {currency.hedgeRatio !== undefined && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getHedgeRatioColor(
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
