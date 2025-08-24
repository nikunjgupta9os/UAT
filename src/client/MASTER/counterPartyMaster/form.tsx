import React, { useState } from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../inputGroup";
import DropdownGroup from "../DropdownGroup";
import Button from "../../ui/Button";
const counterpartyTypes = ["Vendor", "Customer", "Employee", "Intercompany"];

const Form: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: any) => {
    // handle form submission
    console.log(data);
  };

  return (
    <>
      <div className="flex justify-center">
        <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
          <div className=" flex justify-between">
            <h2 className="text-xl font-semibold text-secondary-text-dark">
              <span>Enter Counterparty Details</span>
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
            <InputGroup
              label="Counterparty Code"
              name="counterpartyCode"
              register={register}
              required
              errors={errors}
              placeholder="Enter unique code"
              maxLength={50}
              pattern={{
                value: /^[A-Za-z0-9_-]+$/,
                message: "Only letters, numbers, _ and - allowed",
              }}
            />
            <InputGroup
              label="Legal Name"
              name="legalName"
              register={register}
              required
              errors={errors}
              placeholder="Enter legal name"
              maxLength={100}
            />
            <DropdownGroup
              label="Counterparty Type"
              name="counterpartyType"
              options={counterpartyTypes}
              register={register}
              required
              errors={errors}
            />
            <InputGroup
              label="Tax ID / Business ID"
              name="taxId"
              register={register}
              errors={errors}
              placeholder="Enter tax or business ID"
              maxLength={50}
            />
            <InputGroup
              label="Address"
              name="address"
              register={register}
              errors={errors}
              placeholder="Enter registered address"
              maxLength={200}
            />
            <InputGroup
              label="City"
              name="city"
              register={register}
              errors={errors}
              placeholder="Enter city"
              maxLength={100}
            />
            <InputGroup
              label="State / Province"
              name="state"
              register={register}
              errors={errors}
              placeholder="Enter state or province"
              maxLength={100}
            />
            <InputGroup
              label="ZIP / Postal Code"
              name="zip"
              register={register}
              errors={errors}
              placeholder="Enter ZIP or postal code"
              maxLength={20}
            />
            <InputGroup
              label="Country"
              name="country"
              register={register}
              errors={errors}
              placeholder="Enter country"
              maxLength={100}
            />
            <InputGroup
              label="Phone Number"
              name="phone"
              register={register}
              errors={errors}
              placeholder="Enter phone number"
              maxLength={20}
              pattern={{
                value: /^[0-9-+() ]+$/,
                message: "Invalid phone number",
              }}
            />
            <InputGroup
              label="Email Address"
              name="email"
              register={register}
              errors={errors}
              placeholder="Enter email address"
              maxLength={100}
              pattern={{
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "Invalid email address",
              }}
            />
          </form>
        </div>
      </div>
    </>
  );
};

export default Form;
