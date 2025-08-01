import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";

interface AdditionalDetailsResponse {
  remarks?: string;
  narration?: string;
  timestamp?: string;
}

const fallbackDetails: AdditionalDetailsResponse = {
  remarks: "",
  narration: "",
  timestamp: new Date().toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }),
};

const fetchAdditionalDetails = async (): Promise<AdditionalDetailsResponse> => {
  const res = await fetch("/api/additional-details"); // 🔁 Replace with actual API
  if (!res.ok) throw new Error("Failed to fetch additional details");
  return res.json();
};

const AdditionalDetails: React.FC = () => {
  const [details, setDetails] = useState<AdditionalDetailsResponse>(fallbackDetails);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchAdditionalDetails()
      .then((res) => setDetails(res))
      .catch((err) => {
         console.error("Error fetching additional details:", err);
        setDetails(fallbackDetails);
        setError("Unable to load additional details.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SectionCard title="Additional Details">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Remarks</label>
            <textarea
              className="border border-border focus:outline-none rounded-md bg-secondary-color-lt text-primary p-2"
              rows={2}
              value={details.remarks || ""}
              readOnly
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Narration</label>
            <textarea
              className="border border-border focus:outline-none rounded-md bg-secondary-color-lt text-primary p-2"
              rows={2}
              value={details.narration || ""}
              readOnly
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Transaction Timestamp</label>
            <div className="border p-2 bg-secondary-color-lt text-secondary-text-dark border-border rounded">
              {details.timestamp}
            </div>
          </div>
        </div>
    </SectionCard>
  );
};

export default AdditionalDetails;
