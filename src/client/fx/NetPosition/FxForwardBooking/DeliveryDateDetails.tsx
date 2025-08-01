import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";

interface DeliveryDetailsResponse {
  modeOfDelivery?: string;
  addDate?: string;
  settlementDate?: string;
  maturityDate?: string;
  deliveryDate?: string;
  dropdownOptions?: string[];
}

const fallbackDetails: DeliveryDetailsResponse = {
  modeOfDelivery: "",
  addDate: "",
  settlementDate: "",
  maturityDate: "",
  deliveryDate: "",
  dropdownOptions: [],
};

const fetchDeliveryDetails = async (): Promise<DeliveryDetailsResponse> => {
  const res = await fetch("/api/delivery-details"); 
  if (!res.ok) throw new Error("Failed to fetch delivery details");
  return res.json();
};

const DeliveryDateDetails: React.FC = () => {
  const [details, setDetails] = useState<DeliveryDetailsResponse>(fallbackDetails);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchDeliveryDetails()
      .then((res) => setDetails(res))
      .catch((err) => {
         console.error("Error fetching delivery details:", err);
        setDetails(fallbackDetails);
        setError("Unable to load delivery details.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SectionCard title="Delivery & Date Details">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">Mode of Delivery</label>
            <select
              className="border p-2 text-secondary-text bg-secondary-color-lt rounded border-border"
              value={details.modeOfDelivery || ""}
              disabled
            >
              <option value="">Choose...</option>
              {details.dropdownOptions?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {[
            { label: "Add Date", value: details.addDate },
            { label: "Settlement Date", value: details.settlementDate },
            { label: "Maturity Date", value: details.maturityDate },
            { label: "Delivery Date", value: details.deliveryDate },
          ].map((field, index) => (
            <div key={index} className="flex flex-col">
              <label className="text-sm text-secondary-text mb-1">{field.label}</label>
              <input
                className="border p-2 bg-secondary-color-lt text-secondary-text rounded border-border"
                type="date"
                value={field.value || ""}
                disabled
              />
            </div>
          ))}
        </div>
    </SectionCard>
  );
};

export default DeliveryDateDetails;
