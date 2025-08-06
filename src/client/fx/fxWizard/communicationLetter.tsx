import React from "react";
import Button from "../../ui/Button"; // Adjust the import path as needed
import { prewrittenText } from "./preText";

const CommunicationLetter = () => {
  return (
    <React.Fragment>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-secondary-text">
            Communication Letter
          </h3>
          <div className="flex justify-end">
            <Button>Export to Text</Button>
          </div>
        </div>
        <textarea
          className="w-full min-h-[100vh] p-4 border border-gray-300 rounded text-base font-mono bg-gray-50 resize-none"
          value={prewrittenText}
          readOnly
        />
      </div>
    </React.Fragment>
  );
};

export default CommunicationLetter;
