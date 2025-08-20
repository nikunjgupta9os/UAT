import NumberInput from "./NumberInput";
import HedgingDetails from "./HedgingDetails";
import AdditionalForwardDetail from "./additionalDetail";
// import CashSettlementComponent from "./CashDetail";
import CashSettlementTable from "./cashSettlement";
import React, { useMemo, useState } from "react";
import Button from "../ui/Button";
import { useNavigate } from "react-router-dom";

interface PaymentMethodProps {
  exposure_header_ids: any;
  currency: any;
  entity: any;
  total_open_amount: any;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({
  exposure_header_ids,
  currency,
  entity,
  total_open_amount,
}) => {
  const navigate = useNavigate();
  const [totalSettlementAmount, setTotalSettlementAmount] = useState<number>(0);
  const [totalAdditionalSettlementAmount, setTotalAdditionalSettlementAmount] =
    useState<number>(0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="font-semibold text-lg text-secondary-text-dark">
            Total Open Amount :&nbsp;
            <span className="text-primary">{total_open_amount}</span>
          </span>
        </div>
        <div>
          <Button
            color="Fade"
            onClick={() => {
              navigate("/fx-output");
            }}
          >
            Next
          </Button>
        </div>
      </div>

      <div>
        <HedgingDetails
          exposure_header_ids={exposure_header_ids}
          currency={currency}
          entity={entity}
          total_open_amount={total_open_amount}
          setTotalSettlementAmount={setTotalSettlementAmount} // <-- pass setter as prop
        />
      </div>

      <div>
        <AdditionalForwardDetail
          exposure_header_ids={exposure_header_ids}
          currency={currency}
          entity={entity}
          total_open_amount={total_open_amount}
          setTotalSettlementAmount={setTotalAdditionalSettlementAmount} // <-- pass setter as prop
        />
      </div>

      <div>
        <CashSettlementTable
          exposure_header_ids={exposure_header_ids}
          currency={currency}
          entity={entity}
          totalSettlementAmount={totalSettlementAmount}
          totalAdditionalSettlementAmount={totalAdditionalSettlementAmount}
          total_open_amount={total_open_amount}
        />
      </div>
    </div>
  );
};

export default PaymentMethod;
