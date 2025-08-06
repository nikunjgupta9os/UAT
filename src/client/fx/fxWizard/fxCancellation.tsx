import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SelectFx from "./SeletFx";
import CancellationDetail from "../fxComponents/CancellationDetails";
import Processing from "./processing";
import ExposureLinkageStatus from "./exposureLinkage";
import Button from "../../ui/Button"; // Adjust the import path as needed

const FxCancellation = () => {
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-secondary-text">
          Inputs: Select Activity & Forwards
        </h3>

        <div className="flex justify-end">
          <Button onClick={() => navigate("/fx-output")}>Process Action</Button>
        </div>
      </div>
      <SelectFx setSelectedUsers={setSelectedUsers} />
      <CancellationDetail />

      <h2 className="text-2xl font-bold text-secondary-text pt-6">
        Processing: Calculations & Linkages
      </h2>
      {selectedUsers.length > 0 ? (
        <>
          <Processing />
          <ExposureLinkageStatus />
        </>
      ) : (
        <div className="py-8 flex justify-center">
          <p className="text-base text-gray-500">
            Select forward contracts to see calculations and linked exposures.
          </p>
        </div>
      )}
    </div>
  );
};

export default FxCancellation;
