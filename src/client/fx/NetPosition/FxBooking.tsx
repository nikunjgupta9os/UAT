import React from "react";
import { useLocation } from "react-router-dom";
// import Section from "../../components/FxBooking/Section";
import Button from "../../../client/ui/Button";
import TransactionDetails from "./FxForwardBooking/TransactionDetails";
import EntityDetails from "./FxForwardBooking/EntityDetails";
import OrderDetails from "./FxForwardBooking/OrderDetails";
import DeliveryDateDetails from "./FxForwardBooking/DeliveryDateDetails";
import FinancialDetails from "./FxForwardBooking/FinancialDetails";
import DealerDetails from "./FxForwardBooking/DealerDetails";
import AdditionalDetails from "./FxForwardBooking/AdditionalDetails";
import Layout from "../../../client/common/Layout";

const FXForwardBookingForm: React.FC = () => {
  const location = useLocation();
  const record = location.state;

  return (
    <Layout title="FX Forward Booking Form">
      <div className="px-6 pb-6 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-secondary-color-lt rounded-lg p-6 border border-border">
              <TransactionDetails />
              <EntityDetails />
              <OrderDetails />
              <DeliveryDateDetails />
              <FinancialDetails />
              <DealerDetails />
              <AdditionalDetails />

              <div className="flex justify-end mr-4 ">  
                <div className="flex max-w-2xl gap-4 mt-6">
                    <Button color="Green" categories="Large">
                    Submit Booking
                    </Button>
                    <Button color="Blue" categories="Large">
                    Print Form
                    </Button>
                    <Button color="Blue" categories="Large">
                    Save Draft
                    </Button>
                    <Button color="Blue" categories="Large">
                    Reset Form
                    </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Right side - Summary panel */}
          {record && (
            <div className="lg:col-span-1 ">
              <div className="bg-secondary-color-lt shadow-lg rounded-xl p-6 border border-border sticky top-20 z-10">
                {" "}
                {/* Increased top spacing */}
                <h2 className="text-xl font-bold text-secondary-text mb-2 text-center tracking-wider">
                  Booking For:
                </h2>
                <div className="mb-4 text-center">
                  <span className="text-primary font-semibold text-base">
                    {record.currency}
                  </span>{" "}
                  <span className="text-secondary-text px-1">|</span>
                  <span className="text-primary font-semibold text-base ml-1">
                    {record.maturity}
                  </span>
                </div>
                <div className="rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {[
                        { label: "Payable", value: record.payable },
                        { label: "Receivable", value: record.receivable },
                        { label: "Forward Buy", value: record.forwardBuy },
                        { label: "Forward Sell", value: record.forwardSell },
                        {
                          label: "Net Exposure",
                          value: (record.receivable - record.payable).toFixed(
                            2
                          ),
                        },
                        {
                          label: "Net Forward",
                          value: (
                            record.forwardBuy - record.forwardSell
                          ).toFixed(2),
                        },
                        {
                          label: "Difference",
                          value: (
                            record.receivable -
                            record.payable -
                            (record.forwardBuy - record.forwardSell)
                          ).toFixed(2),
                        },
                      ].map((item, idx) => {
                        const isNegative = parseFloat(item.value) < 0;
                        const isDifferenceRow = idx === 6;
                        const formattedValue = `${item.value}`; // Add 'M' suffix

                        return (
                          <tr
                            key={idx}
                            className={`${isNegative ? "bg-red-50" : ""} ${
                              isDifferenceRow
                                ? "border-t-2 border-gray-300"
                                : ""
                            }`}
                          >
                            <td
                              className={`px-4 py-3 ${
                                isDifferenceRow
                                  ? "text-gray-700 font-semibold"
                                  : "text-secondary-text-dark"
                              }`}
                            >
                              {item.label}
                            </td>
                            <td
                              className={`px-4 py-3 text-right ${
                                isNegative
                                  ? "text-red-600 font-bold"
                                  : isDifferenceRow
                                  ? "text-blue-600 font-bold"
                                  : "text-secondary-text-dark"
                              }`}
                            >
                              {formattedValue}{" "}
                              {/* Use formatted value with 'M' */}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-secondary-text text-center">
                  Last updated: {new Date().toLocaleString()}
                </div>
               
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FXForwardBookingForm;
