import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";
import CustomSelect from "../../common/SearchSelect"; // adjust path if needed

interface DealerDetailsResponse {
  internalDealer: string;
  counterpartyDealer: string;
  internalDealerOptions: string[];
}

type OptionType = {
  label: string;
  value: string;
};

type DealerState = {
  internalDealer: string;
  counterpartyDealer: string;
};

interface DealerDetailsProps {
  dealerInfo: DealerState;
  isThere?: boolean; // Optional prop to control if the component is in a "view" mode
  setDealerInfo: React.Dispatch<React.SetStateAction<DealerState>>;
}

// Mock fallback data
const mockOptions = [
  { label: "Dealer A", value: "Dealer A" },
  { label: "Dealer B", value: "Dealer B" },
  { label: "Dealer C", value: "Dealer C" },
];

const mockDealerData: DealerDetailsResponse = {
  internalDealer: "Dealer A",
  counterpartyDealer: "Counterparty X",
  internalDealerOptions: ["Dealer A", "Dealer B", "Dealer C"],
};

const DealerDetails: React.FC<DealerDetailsProps> = ({ dealerInfo, setDealerInfo , isThere=false}) => {
  const [options, setOptions] = useState<OptionType[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 
  return (
    <SectionCard title="Dealer Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          label="Internal Dealer"
          options={options}
          selectedValue={dealerInfo.internalDealer}
          onChange={(val) =>
            setDealerInfo((prev) => ({ ...prev, internalDealer: val }))
          }
          placeholder="Choose internal dealer..."
          isClearable={false}
          isDisabled={isThere}
        />

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Counterparty Dealer
          </label>
          <input
            type="text"
            className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
            value={dealerInfo.counterpartyDealer}
            onChange={(e) =>
              setDealerInfo((prev) => ({
                ...prev,
                counterpartyDealer: e.target.value,
              }))
            }
            disabled={isThere}
            placeholder="Enter counterparty dealer"
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default DealerDetails;
