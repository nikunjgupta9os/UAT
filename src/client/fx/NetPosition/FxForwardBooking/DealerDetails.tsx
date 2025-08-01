import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";

interface DealerDetailsResponse {
  internalDealer: string;
  counterpartyDealer: string;
  internalDealerOptions: string[];
}

const DealerDetails: React.FC = () => {
  const [data, setData] = useState<DealerDetailsResponse>({
    internalDealer: "",
    counterpartyDealer: "",
    internalDealerOptions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    fetch("/api/dealer-details") // 🔁 Replace with actual API
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dealer details");
        return res.json();
      })
      .then((resData: DealerDetailsResponse) => {
        setData(resData);
      })
      .catch((err) => {
         console.error("Error fetching dealer details:", err);
        setError("Unable to load dealer details.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SectionCard title="Dealer Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Internal Dealer</label>
            <select
              className="border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
              value={data.internalDealer}
              disabled
            >
              <option value="">Choose...</option>
              {data.internalDealerOptions.map((dealer, idx) => (
                <option key={idx} value={dealer}>
                  {dealer}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Counterparty Dealer</label>
            <input
              className="border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
              type="text"
              value={data.counterpartyDealer}
              disabled
            />
          </div>
        </div>
    </SectionCard>
  );
};

export default DealerDetails;
