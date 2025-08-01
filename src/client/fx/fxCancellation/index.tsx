import React from "react";
// import { useEffect, useState } from "react";
// import SectionCard from "./component/SectionCard";
// import { Section } from "lucide-react";
import Button from "../../ui/Button";
import Layout from "../../common/Layout";
import TransactionDetails from "./component/transactionDetails";
import DealerDetails from "./component/orderDetails";
import ChargesGainLoss from "./component/chargeDetails";
import EntityDetails from "../fxComponents/EntityDetails";
// import CustomSelect from "../../common/SearchSelect";
import ExposureInfo from "./component/ExposureDetails";
import HedgingDetails from "./component/HedgingDetails";
import AdditionalDetails from "./component/additionalDetails";
const FxCancellation: React.FC = () => {
  return (
    <React.Fragment>
      <Layout title="Fx Cancellation Form" showButton={false}>
        <div className="mb-6 pt-4">
          <div className="transition-opacity duration-300">
            <div className="min-h-screen space-y-6 w-full">
              <div className="flex items-center justify-end gap-2">
                <div className="w-15rem">
                  <Button>Submit Booking</Button>
                </div>
                <div className="w-15rem">
                  <Button>Print Form</Button>
                </div>
                <div className="w-15rem">
                  <Button>Save Draft</Button>
                </div>
                <div className="w-15rem">
                  <Button>Reset Form</Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 w-full p-6 gap-4 rounded-lg border border-border">
                <div>
                  <TransactionDetails />
                </div>

                <div>
                  {/* <EntityDetails /> */}
                </div>

                <div> <DealerDetails /> </div>

                <div> <ChargesGainLoss /> </div> 

                <div> <ExposureInfo /> </div>   

                {/* <div> <HedgingDetails /> </div> */}

                <div>  <AdditionalDetails /> </div>

                
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </React.Fragment>
  );
};

export default FxCancellation;
