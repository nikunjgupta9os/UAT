import SectionCard from "./SectionCard";

const TransactionDetails = () => (
  <SectionCard title="Transaction Details">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col">
        <label className="text-sm text-secondary-text mb-1">System Reference</label>
        <input
        className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
          type="text"
          placeholder="Auto-generated"
          disabled
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm text-secondary-text mb-1">Counter Party</label>
        <input
          className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border focus:outline-none"
          type="text"
          placeholder="Internal Reference ID"
          disabled
        />
      </div>
    </div>
  </SectionCard>
);

export default TransactionDetails;
