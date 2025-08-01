import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";

interface BUEntityResponse {
  buEntity1?: string;
  buEntity2?: string;
  buEntity3?: string;
  buEntity4?: string;
}

// Optional fallback (can be imported or defined here)
const fallbackEntityData: BUEntityResponse = {
  buEntity1: "-",
  buEntity2: "-",
  buEntity3: "-",
  buEntity4: "-",
};

// Fake API call function (replace with real fetch later)
const fetchEntityDetails = async (): Promise<BUEntityResponse> => {
  const response = await fetch("/api/entity-details");
  if (!response.ok) throw new Error("Failed to fetch entity details");
  return response.json();
};

const EntityDetails: React.FC = () => {
  const [entities, setEntities] = useState<BUEntityResponse>(fallbackEntityData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    fetchEntityDetails()
      .then((res) => {
        setEntities(res);
      })
      .catch((err) => {
         console.error("Error fetching entity details:", err);
        setEntities(fallbackEntityData);
        setError("Unable to load entity data.");
      })
  }, []);

  const fields = [
    { label: "BU Entity 1", value: entities.buEntity1 },
    { label: "BU Entity 2", value: entities.buEntity2 },
    { label: "BU Entity 3", value: entities.buEntity3 },
    { label: "BU Entity 4", value: entities.buEntity4 },
  ];

  return (
    <SectionCard title="Entity Details">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {fields.map((field, idx) => (
            <div key={idx} className="flex flex-col">
              <label className="text-sm text-secondary-text">{field.label}</label>
              <div className="mt-1 border border-border rounded px-3 py-2 bg-secondary-color-lt text-secondary-text-dark min-h-[38px]">
                {field.value || "-"}
              </div>
            </div>
          ))}
        </div>
    </SectionCard>
  );
};

export default EntityDetails;
