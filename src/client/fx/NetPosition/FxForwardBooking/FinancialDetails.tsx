import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";

interface FinancialDetailsResponse {
  currencyPair: string;
  valueFCY: number;
  valueType: string;
  spotRate: number;
  forwardPoints: number;
  bankMargin: number;
  totalRate: number;
  valueLCY: number;
}

const FinancialDetails: React.FC = () => {
  const [formData, setFormData] = useState<FinancialDetailsResponse>({
    currencyPair: "",
    valueFCY: 0,
    valueType: "",
    spotRate: 0,
    forwardPoints: 0,
    bankMargin: 0,
    totalRate: 0,
    valueLCY: 0,
  });

  const [currencyPairs, setCurrencyPairs] = useState<string[]>([]);
  const [valueTypes, setValueTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    // Fetch dropdown options
    fetch("/api/financial-dropdown-options")
      .then((res) => res.json())
      .then((data) => {
        setCurrencyPairs(data.currencyPairs || []);
        setValueTypes(data.valueTypes || []);
      })
      .catch((err) => {
         console.error("Error fetching dropdowns:", err);
      });

    // Fetch financial details
    fetch("/api/financial-details")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch financial details");
        return res.json();
      })
      .then((data) => setFormData(data))
      .catch((err) => {
         console.error("Error fetching financial details:", err);
        setError("Failed to load financial details.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SectionCard title="Financial Details">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Currency Pair</label>
            <select
              className="border p-2 text-secondary-text bg-secondary-color-lt rounded border-border"
              value={formData.currencyPair}
              disabled
            >
              <option value="">Choose...</option>
              {currencyPairs.map((pair, index) => (
                <option key={index} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Value (FCY)</label>
            <input
              className="border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
              type="number"
              value={formData.valueFCY}
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Value Type</label>
            <select
              className="border p-2 text-secondary-text bg-secondary-color-lt rounded border-border"
              value={formData.valueType}
              disabled
            >
              <option value="">Choose...</option>
              {valueTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Spot Rate</label>
            <input
              className="border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
              type="number"
              value={formData.spotRate}
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Forward Points</label>
            <input
              className="border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
              type="number"
              value={formData.forwardPoints}
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Bank Margin</label>
            <input
              className="border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
              type="number"
              value={formData.bankMargin}
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Total Rate</label>
            <input
              className="border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
              type="number"
              value={formData.totalRate}
              disabled
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Value (LCY)</label>
            <input
              className="border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
              type="number"
              value={formData.valueLCY}
              disabled
            />
          </div>
        </div>
    </SectionCard>
  );
};

export default FinancialDetails;
