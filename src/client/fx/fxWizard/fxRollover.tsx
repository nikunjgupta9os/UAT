import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NewForward from "../fxComponents/NewForward";
import SelectFx from "./SeletFx";
import CancellationDetail from "../fxComponents/CancellationDetails";
import Processing from "./processing";
import ExposureLinkageStatus from "./exposureLinkage";
import Button from "../../ui/Button"; // Adjust the import path as needed
import axios from "axios"; // Add this import
import { useNotification } from "../../Notification/Notification";
// Define the type for selected forward contract data
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

type OldForward = {
  dealId: string;
  originalRate: string;
  currentSpotRate: string;
  currentFwdRate: string;
  amountProcessed: string;
  gainLossSpot: string;
  edImpact: string;
};

const FxCancellation = () => {
  const [selectedUsers, setSelectedUsers] = useState<SelectedForwardContract[]>(
    []
  );
  const [form, setForm] = useState({
    currentSpotRate: "",
    currentForwardRate: "",
    bankCharges: "",
    discountRate: "",
    reason: "",
  });

  const [oldForwardsData, setOldForwardsData] = useState<OldForward[]>([]);
  const [newForwardForm, setNewForwardForm] = useState({
    fxPair: "",
    orderType: "",
    maturityDate: "",
    amount: "",
    spotRate: "",
    premiumDiscount: "",
    marginRate: "",
    netRate: "",
  });
  const navigate = useNavigate();

  // Helper to sum numbers from string fields
  const sumAmounts = (
    arr: SelectedForwardContract[],
    key: keyof SelectedForwardContract
  ) => arr.reduce((sum, item) => sum + Number(item[key]), 0);

  // Helper to sum gainLossSpot from oldForwardsData
  const sumGainLossSpot = (arr: OldForward[]) =>
    arr.reduce((sum, item) => {
      const value = Number(item.gainLossSpot);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

  const { notify } = useNotification();

  // Handler for Process Action
  const handleProcessAction = async () => {
    const exposureHeaderIds = selectedUsers.map(
      (user) => user.exposure_header_id
    );
    const amount_cancelled = sumAmounts(
      selectedUsers,
      "amount_to_cancel_rollover"
    );
    const cancellation_date = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

    // Assume all selected have same order_type (buy/sell)
    const orderType = selectedUsers[0]?.order_type?.toLowerCase() || "buy";
    const currentSpotRate = Number(form.currentSpotRate) || 0;
    const currentForwardRate = Number(form.currentForwardRate) || 0;
    const bankCharges = Number(form.bankCharges) || 0;

    let cancellation_rate = 0;
    if (orderType === "buy") {
      cancellation_rate = currentSpotRate + currentForwardRate + bankCharges;
    } else {
      cancellation_rate = currentSpotRate + currentForwardRate - bankCharges;
    }

    const realized_gain_loss = sumGainLossSpot(oldForwardsData);
    const cancellation_reason = form.reason;

    const payload = {
      booking_ids: exposureHeaderIds,
      amount_cancelled,
      cancellation_date,
      cancellation_rate,
      realized_gain_loss,
      cancellation_reason,
    };
    console.log("Payload for cancellation:", payload);

    try {
      const res = await axios.post(
        "https://backend-slqi.onrender.com/api/settlement/create-cancellations",
        payload
      );
      // Handle success (navigate, show toast, etc.)
      notify("Cancellation processed successfully", "success");
      navigate("/fx-output");
    } catch (err) {
      // Handle error (show error message, etc.)
      notify("Failed to process cancellation", "error");
    }
  };

  const handleRollover = (field: string, value: string) => {
    setNewForwardForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4">
        <h3 className="text-2xl font-bold text-secondary-text">
          Inputs: Select Activity & Forwards
        </h3>

        <div className="flex justify-end">
          <Button onClick={handleProcessAction}>Process Action</Button>
        </div>
      </div>
      <SelectFx setSelectedUsers={setSelectedUsers} />
      <CancellationDetail form={form} setForm={setForm} />
      <NewForward
        selectedUsers={selectedUsers}
        form={newForwardForm}
        handleRollover={handleRollover}
      />

      <h2 className="text-2xl font-bold text-secondary-text pt-10">
        Processing: Calculations & Linkages
      </h2>
      {selectedUsers.length > 0 ? (
        <>
          <Processing
            selectedUsers={selectedUsers}
            form={form}
            setOldForwardsData={setOldForwardsData}
          />
          <ExposureLinkageStatus selectedUsers={selectedUsers} />
          <h2 className="text-2xl font-bold text-secondary-text pt-8">
            New Forward Details (Post-Rollover)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 px-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-secondary-text">
                New FX Pair:
              </span>
              <span className="font-semibold text-primary">
                {newForwardForm.fxPair || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-secondary-text">
                New Order Type:
              </span>
              <span className="font-semibold text-primary">
                {newForwardForm.orderType || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-secondary-text">
                New Amount:
              </span>
              <span className="font-semibold text-primary">
                {newForwardForm.amount
                  ? Number(newForwardForm.amount).toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                    })
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-secondary-text">
                New Maturity Date:
              </span>
              <span className="font-semibold text-primary">
                {newForwardForm.maturityDate || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-secondary-text">
                New Spot Rate:
              </span>
              <span className="font-semibold text-primary">
                {newForwardForm.spotRate || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-secondary-text">
                New Premium/Discount:
              </span>
              <span className="font-semibold text-primary">
                {newForwardForm.premiumDiscount || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-secondary-text">
                New Margin Rate:
              </span>
              <span className="font-semibold text-primary">
                {newForwardForm.marginRate || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-secondary-text">
                New Net Rate:
              </span>
              <span className="font-semibold text-primary">
                {newForwardForm.netRate
                  ? Number(newForwardForm.netRate).toFixed(4)
                  : "0.0000"}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="py-8 flex justify-center">
          <p className="text-base text-primary">
            Select forward contracts to see calculations and linked exposures.
          </p>
        </div>
      )}
    </div>
  );
};

export default FxCancellation;
