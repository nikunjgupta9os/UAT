import React, { useEffect } from "react";
import SectionCard from "./SectionCard";
import CustomSelect from "../../common/SearchSelect";

// Add this type import if needed
// import { SelectedForwardContract } from "../fxWizard/fxRollover"; // adjust path if needed

type SelectedForwardContract = {
  exposure_header_id: string;
  deal_id: string;
  fx_pair: string;
  original_amount: string;
  amount_to_cancel_rollover: string;
  original_rate: string;
  maturity: string;
  counterparty: string;
  order_type: string;
  company: string;
  entity: string;
};

interface NewForwardProps {
  selectedUsers: SelectedForwardContract[];
  form: {
    fxPair: string;
    orderType: string;
    maturityDate: string;
    amount: string;
    spotRate: string;
    premiumDiscount: string;
    marginRate: string;
    netRate: string;
  };
  handleRollover: (field: string, value: string) => void;
}

const fxPairOptions = [
  { value: "USD/INR", label: "USD/INR" },
  { value: "EUR/INR", label: "EUR/INR" },
  { value: "GBP/INR", label: "GBP/INR" },
  // Add more as needed
];

const orderTypeOptions = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
];

const NewForward: React.FC<NewForwardProps> = ({ selectedUsers, form, handleRollover }) => {
  // Calculate sum of amount_to_cancel_rollover
  useEffect(() => {
    const sum = selectedUsers.reduce(
      (acc, curr) => acc + Number(curr.amount_to_cancel_rollover || 0),
      0
    );
    handleRollover("amount", sum ? sum.toString() : "");
  }, [selectedUsers]);

  useEffect(() => {
    const spot = Number(form.spotRate) || 0;
    const premium = Number(form.premiumDiscount) || 0;
    const margin = Number(form.marginRate) || 0;
    let net = 0;

    if (form.orderType === "Buy") {
      net = spot + premium + margin;
    } else if (form.orderType === "Sell") {
      net = spot + premium - margin;
    }
    handleRollover("netRate", net ? net.toFixed(4) : "");
  }, [form.spotRate, form.premiumDiscount, form.marginRate, form.orderType]);

  const handleChange = (field: string) => (value: string) => {
    handleRollover(field, value);
  };

  // You can now use selectedUsers inside this component

  return (
    <SectionCard title="New Forward Booking Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomSelect
          label="New FX Pair"
          options={fxPairOptions}
          selectedValue={form.fxPair}
          onChange={handleChange("fxPair")}
          placeholder="Select..."
        />

        <CustomSelect
          label="New Order Type *"
          options={orderTypeOptions}
          selectedValue={form.orderType}
          onChange={handleChange("orderType")}
          placeholder="Select..."
        />

        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text mb-1">
            New Maturity Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.maturityDate}
            onChange={e => handleRollover("maturityDate", e.target.value)}
            className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text mb-1">
            New Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={e => handleRollover("amount", e.target.value)}
            className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text mb-1">
            Spot Rate (New Booking) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.0001"
            value={form.spotRate}
            onChange={e => handleRollover("spotRate", e.target.value)}
            className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text mb-1">
            Premium/Discount (New Booking)
          </label>
          <input
            type="number"
            step="0.0001"
            value={form.premiumDiscount}
            onChange={e => handleRollover("premiumDiscount", e.target.value)}
            className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text mb-1">
            Margin Rate (New Booking)
          </label>
          <input
            type="number"
            step="0.0001"
            value={form.marginRate}
            onChange={e => handleRollover("marginRate", e.target.value)}
            className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text mb-1">
            Net Rate (New Booking)
          </label>
          <input
            type="number"
            step="0.0001"
            value={form.netRate}
            // Disabled and gray
            disabled
            className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
            autoComplete="off"
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default NewForward;