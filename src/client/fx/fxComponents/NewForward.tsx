import React, { useState } from "react";
import SectionCard from "./SectionCard";
import CustomSelect from "../../common/SearchSelect";

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

const NewForward: React.FC = () => {
  const [form, setForm] = useState({
    fxPair: "",
    orderType: "",
    maturityDate: "",
    amount: "",
    spotRate: "",
    premiumDiscount: "",
    marginRate: "",
    netRate: "",
  });

  const handleChange = (field: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
            onChange={e => setForm(prev => ({ ...prev, maturityDate: e.target.value }))}
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
            onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
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
            onChange={e => setForm(prev => ({ ...prev, spotRate: e.target.value }))}
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
            onChange={e => setForm(prev => ({ ...prev, premiumDiscount: e.target.value }))}
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
            onChange={e => setForm(prev => ({ ...prev, marginRate: e.target.value }))}
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