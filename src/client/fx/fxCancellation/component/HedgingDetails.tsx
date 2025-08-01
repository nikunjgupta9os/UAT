import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";

interface HedgedExposure {
  hedgeId: string;
  exposureId: string;
  instrument: string;
  notional: string;
  hedgeDate: string;
}

const HedgingDetails: React.FC = () => {
  const [exposures, setExposures] = useState<HedgedExposure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hedged-exposures")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load hedged exposures");
        return res.json();
      })
      .then((data: HedgedExposure[]) => setExposures(data))
      .catch((err) => {
        console.error(err);
        setError("Unable to load hedged exposures.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Descriptive Info */}
      <SectionCard title="Hedging Details">
        <div className="text-sm text-secondary-text space-y-2">
          <p><strong>Note:</strong> Describes the hedge structure for the cancellation.</p>
          <p>Depends on hedge logic (if any).</p>
          <p>Could include the fields below or reference a separate grid.</p>
        </div>
      </SectionCard>

      {/* Grid of Hedged Exposures */}
      <SectionCard title="Hedged Exposures">
        {loading ? (
          <p className="text-sm text-gray-500">Loading exposures...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : exposures.length === 0 ? (
          <p className="text-sm text-gray-400">No hedges found for this exposure.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm border rounded">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-4 py-2 border">Hedge ID</th>
                  <th className="px-4 py-2 border">Exposure ID</th>
                  <th className="px-4 py-2 border">Instrument</th>
                  <th className="px-4 py-2 border">Notional</th>
                  <th className="px-4 py-2 border">Hedge Date</th>
                </tr>
              </thead>
              <tbody>
                {exposures.map((item) => (
                  <tr key={item.hedgeId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{item.hedgeId}</td>
                    <td className="px-4 py-2 border">{item.exposureId}</td>
                    <td className="px-4 py-2 border">{item.instrument}</td>
                    <td className="px-4 py-2 border">{item.notional}</td>
                    <td className="px-4 py-2 border">{item.hedgeDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
};

export default HedgingDetails;
