import React from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../MASTER/inputGroup";
import DropdownGroup from "../../MASTER/DropdownGroup";
import Button from "../../ui/Button";

const centreTypes = ["Cost Centre", "Profit Centre"];
const businessUnits = ["Finance Division", "Marketing Division", "Operations Division", "R&D Division"]; // Example, can be fetched dynamically
const statusOptions = ["Active", "Inactive"];

const ERP: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: any) => {
    console.log(data); 
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold text-secondary-text-dark">
            <span>Fetch Bank Statements</span>
          </h2>
          <div className="flex items-center justify-end gap-x-4 gap-2">
            <div>
              <Button onClick={() => {}}>Save Manual Entries</Button>
            </div>
            <div>
              <Button onClick={() => {}} color="Fade">
                Reset
              </Button>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          {/* Centre Code/ID */}
          <InputGroup
            label="Centre Code/ID"
            name="centre_code"
            register={register}
            required
            errors={errors}
            placeholder="Enter a unique centre code"
            maxLength={50}
            pattern={{
              value: /^[A-Za-z0-9_-]+$/,
              message: "Only letters, numbers, _ and - allowed",
            }}
          />

          {/* Centre Name */}
          <InputGroup
            label="Centre Name"
            name="centre_name"
            register={register}
            required
            errors={errors}
            placeholder='e.g., "Marketing Department", "Project Phoenix"'
            maxLength={100}
          />

          {/* Centre Type */}
          <DropdownGroup
            label="Centre Type"
            name="centre_type"
            options={centreTypes}
            register={register}
            required
            errors={errors}
          />

          {/* Business Unit/Division */}
          <DropdownGroup
            label="Business Unit / Division"
            name="business_unit"
            options={businessUnits}
            register={register}
            required={false} // Optional field
            errors={errors}
          />

          {/* Owner/Manager */}
          <InputGroup
            label="Owner / Manager"
            name="owner_manager"
            register={register}
            required={false}
            errors={errors}
            placeholder="Enter name of person responsible"
            maxLength={100}
          />

          {/* Status */}
          <DropdownGroup
            label="Status"
            name="status"
            options={statusOptions}
            register={register}
            required
            errors={errors}
          />
        </form>
      </div>
    </div>
  );
};

export default ERP;
