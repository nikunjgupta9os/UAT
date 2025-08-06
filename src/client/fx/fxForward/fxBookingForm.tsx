import React, { useEffect, useState, useCallback } from "react";
import Button from "../../ui/Button";
import axios from "axios";
// import Layout from "../../common/Layout";
import OrderDetails from "../fxComponents/OrderDetails";
import TransactionDetails from "../fxComponents/TransactionDetails";
import EntityDetails from "../fxComponents/EntityDetails"; // or EntityDropdownTable
import DealerDetails from "../fxComponents/DealerDetails";
import DeliveryDateDetails from "../fxComponents/DeliveryDateDetails";
import FinancialDetails from "../fxComponents/FinancialDetails";
import AdditionalDetails from "../fxComponents/AdditionalDetails";
import { useNotification } from "../../Notification/Notification";
type EntityState = {
  buEntity0: string | null;
  buEntity1: string | null;
  buEntity2: string | null;
  buEntity3: string | null;
};

type FinancialDetailsResponse = {
  currencyPair: string;
  valueType: string;
  inputValue: number | null; // Added inputValue for booking amount
  actualValueBaseCurrency: number | null;
  spotRate: number | null;
  forwardPoints: number | null;
  bankMargin: number | null;
  totalRate: number | null;
  valueQuoteCurrency: number | null;
  interveningRateQuoteToLocal: number | null;
  valueLocalCurrency: number | null;
  baseCurrency: string;
  quoteCurrency: string;
};

type OrderState = {
  orderType: string;
  transactionType: string;
  counterparty: string;
  localCurrency: string;
};

interface AdditionalDetailsResponse {
  remarks?: string;
  narration?: string;
  timestamp?: string;
}

type DeliveryDetails = {
  modeOfDelivery: string;
  deliveryPeriod: string;
  addDate: string;
  settlementDate: string;
  maturityDate: string;
  deliveryDate: string;
};

type DealerState = {
  internalDealer: string;
  counterpartyDealer: string;
};

type OptionType = {
  value: string;
  label: string;
};

// API payload type matching the backend requirements
type ApiPayload = {
  internal_reference_id: string;
  entity_level_0: string;
  entity_level_1: string;
  entity_level_2: string;
  entity_level_3: string;
  local_currency: string;
  order_type: string;
  transaction_type: string;
  counterparty: string;
  mode_of_delivery: string;
  delivery_period: string;
  add_date: string;
  settlement_date: string;
  maturity_date: string;
  delivery_date: string;
  currency_pair: string;
  base_currency: string;
  quote_currency: string;
    booking_amount: number;
  value_type: string;
  actual_value_base_currency: number;
  spot_rate: number;
  forward_points: number;
  bank_margin: number;
  total_rate: number;
  value_quote_currency: number;
  intervening_rate_quote_to_local: number;
  value_local_currency: number;
  internal_dealer: string;
  counterparty_dealer: string;
  remarks: string;
  narration: string;
  transaction_timestamp: string;
};

const FxBookingForm: React.FC = () => {
  const [transactionInfo, setTransactionInfo] = useState({
    systemTransactionId: "TXN-12345",
    internalReferenceId: "",
  });

  const [dealerInfo, setDealerInfo] = useState<DealerState>({
    internalDealer: "",
    counterpartyDealer: "",
  });

  const [entityValues, setEntityValues] = useState<EntityState>({
    buEntity0: null,
    buEntity1: null,
    buEntity2: null,
    buEntity3: null,
  });

  const [orderDetails, setOrderDetails] = useState<OrderState>({
    orderType: "",
    transactionType: "",
    counterparty: "",
    localCurrency: "INR",
  });

  const [financialData, setFinancialData] = useState<FinancialDetailsResponse>({
    currencyPair: "",
    inputValue: null,
    valueType: "",
    actualValueBaseCurrency: null,
    spotRate: null,
    forwardPoints: null,
    bankMargin: null,
    totalRate: null,
    valueQuoteCurrency: null,
    interveningRateQuoteToLocal: null,
    valueLocalCurrency: null,
    baseCurrency: "",
    quoteCurrency: "",
  });

  const [currencyPairs, setCurrencyPairs] = useState<OptionType[]>([]);
  const [financialLoading, setFinancialLoading] = useState<boolean>(true);

  // Fetch currency pairs and financial details
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    modeOfDelivery: "",
    deliveryPeriod: "",
    addDate: "",
    settlementDate: "",
    maturityDate: "",
    deliveryDate: "",
  });

  const [additionalDetails, setAdditionalDetails] =
    useState<AdditionalDetailsResponse>({
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
    });

  const { notify } = useNotification();

  // Loading and error states for API submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const handleInternalRefChange = useCallback(
    (value: string) => {
      setTransactionInfo((prev) => ({ ...prev, internalReferenceId: value }));
    },
    [setTransactionInfo]
  );

  // Function to extract base and quote currencies from currency pair
  const extractCurrencies = (currencyPair: string) => {
    if (currencyPair.length === 6) {
      return {
        base_currency: currencyPair.substring(0, 3),
        quote_currency: currencyPair.substring(3, 6),
      };
    }
    return { base_currency: "", quote_currency: "" };
  };

  // Function to format date to YYYY-MM-DD format
  const formatDateForApi = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Function to format timestamp to ISO format
  const formatTimestampForApi = (timestamp: string): string => {
    if (!timestamp) return new Date().toISOString();
    try {
      const date = new Date(timestamp);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  // Function to prepare API payload
  const prepareApiPayload = (): ApiPayload => {
    const { base_currency, quote_currency } = extractCurrencies(
      financialData.currencyPair
    );

    return {
      internal_reference_id: transactionInfo.internalReferenceId,
      entity_level_0: entityValues.buEntity0 || "",
      entity_level_1: entityValues.buEntity1 || "",
      entity_level_2: entityValues.buEntity2 || "",
      entity_level_3: entityValues.buEntity3 || "",
      local_currency: orderDetails.localCurrency,
      order_type: orderDetails.orderType,
      transaction_type: orderDetails.transactionType,
      counterparty: orderDetails.counterparty,
      mode_of_delivery: deliveryDetails.modeOfDelivery,
      delivery_period: deliveryDetails.deliveryPeriod,
      add_date: formatDateForApi(deliveryDetails.addDate),
      settlement_date: formatDateForApi(deliveryDetails.settlementDate),
      maturity_date: formatDateForApi(deliveryDetails.maturityDate),
      delivery_date: formatDateForApi(deliveryDetails.deliveryDate),
      currency_pair: financialData.currencyPair,
      base_currency: financialData.baseCurrency || base_currency,
      quote_currency: financialData.quoteCurrency || quote_currency,
         booking_amount: financialData.inputValue,

      value_type: financialData.valueType,
      actual_value_base_currency: financialData.actualValueBaseCurrency,
      spot_rate: financialData.spotRate,
      forward_points: financialData.forwardPoints,
      bank_margin: financialData.bankMargin,
      total_rate: financialData.totalRate,
      value_quote_currency: financialData.valueQuoteCurrency,
      intervening_rate_quote_to_local:
        financialData.interveningRateQuoteToLocal,
      value_local_currency: financialData.valueLocalCurrency,
      internal_dealer: dealerInfo.internalDealer,
      counterparty_dealer: dealerInfo.counterpartyDealer,
      remarks: additionalDetails.remarks || "",
      narration: additionalDetails.narration || "",
      transaction_timestamp: formatTimestampForApi(
        additionalDetails.timestamp || ""
      ),
    };
  };

  // Function to validate required fields
  const validateForm = (): string | null => {
    if (!transactionInfo.internalReferenceId)
      return "Internal Reference ID is required";
    if (!orderDetails.orderType) return "Order Type is required";
    if (!orderDetails.transactionType) return "Transaction Type is required";
    if (!orderDetails.counterparty) return "Counterparty is required";
    if (!financialData.currencyPair) return "Currency Pair is required";
    if (!financialData.inputValue || financialData.inputValue <= 0) return "Valid booking amount is required";
    if (!deliveryDetails.modeOfDelivery) return "Mode of Delivery is required";

    return null;
  };

  // Function to submit the booking
  const handleSubmitBooking = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      // Validate form before submission
      const validationError = validateForm();
      if (validationError) {
        notify(validationError, "error");
        setSubmitError(validationError);
        return;
      }

      // Prepare payload
      const payload = prepareApiPayload();
      console.log("Submitting payload:", payload);

      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/forwards/forward-bookings/manual-entry",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      notify("Booking submitted successfully!", "success");
      console.log("Booking submitted successfully:", response.data);

      setSubmitSuccess(true);
      // Optionally reset form or redirect user
    } catch (error) {
      console.error("Error submitting booking:", error);

      let errorMessage = "An error occurred while submitting the booking";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      }

      notify(`Error submitting booking: ${errorMessage}`, "error");
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to reset form
  const handleResetForm = () => {
    setTransactionInfo({
      systemTransactionId: "TXN-12345",
      internalReferenceId: "",
    });
    setDealerInfo({
      internalDealer: "",
      counterpartyDealer: "",
    });
    setEntityValues({
      buEntity0: null,
      buEntity1: null,
      buEntity2: null,
      buEntity3: null,
    });
    setOrderDetails({
      orderType: "",
      transactionType: "",
      counterparty: "",
      localCurrency: "INR",
    });
    setFinancialData({
      currencyPair: "",
      inputValue: null,
      valueType: "",
      actualValueBaseCurrency: null,
      spotRate: null,
      forwardPoints: null,
      bankMargin: null,
      totalRate: null,
      valueQuoteCurrency: null,
      interveningRateQuoteToLocal: null,
      valueLocalCurrency: null,
      baseCurrency: "",
      quoteCurrency: "",
    });
    setDeliveryDetails({
      modeOfDelivery: "",
      deliveryPeriod: "",
      addDate: "",
      settlementDate: "",
      maturityDate: "",
      deliveryDate: "",
    });
    setAdditionalDetails({
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
    });
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  return (
    <React.Fragment>
      <div className="mb-6 pt-4">
        <div className="transition-opacity duration-300">
          <div className="min-h-screen space-y-6 w-full">
            {/* Error and Success Messages */}

            <div className="flex items-center justify-end gap-2">
              <div className="w-15rem">
                <Button onClick={handleSubmitBooking} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Booking"}
                </Button>
              </div>
              <div className="w-15rem">
                <Button>Print Form</Button>
              </div>
              <div className="w-15rem">
                <Button>Save Draft</Button>
              </div>
              <div className="w-15rem">
                <Button onClick={handleResetForm}>Reset Form</Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 w-full p-6 gap-4 rounded-lg border border-border">
              <div>
                <TransactionDetails
                  systemTransactionId={transactionInfo.systemTransactionId}
                  internalReferenceId={transactionInfo.internalReferenceId}
                  onInternalRefChange={handleInternalRefChange}
                />
              </div>
              <div>
                <EntityDetails
                  entityState={entityValues}
                  setEntityState={setEntityValues}
                />
              </div>
              <div>
                <DealerDetails
                  dealerInfo={dealerInfo}
                  setDealerInfo={setDealerInfo}
                />
              </div>
              <div>
                <OrderDetails
                  orderDetails={orderDetails}
                  setOrderDetails={setOrderDetails}
                />
              </div>
              <div>
                <FinancialDetails
                  formData={financialData}
                  setFormData={setFinancialData}
                  currencyPairs={currencyPairs}
                  isLoading={false}
                  orderType={orderDetails.orderType} // Pass order type to FinancialDetails
                />
              </div>
              <div>
                <DeliveryDateDetails
                  details={deliveryDetails}
                  setDetails={setDeliveryDetails}
                  isLoading={false} // or true when loading
                />
              </div>
              <div>
                <AdditionalDetails
                  details={additionalDetails}
                  setDetails={setAdditionalDetails}
                  isLoading={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default FxBookingForm;
