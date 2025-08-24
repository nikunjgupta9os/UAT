import React from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../inputGroup";
import DropdownGroup from "../DropdownGroup";
import Button from "../../ui/Button";

// You can define account types dynamically if needed
const accountTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

const Form: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: any) => {
    console.log(data); // handle GL Account submission
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold text-secondary-text-dark">
            <span>Enter GL Account Details</span>
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
          {/* GL Account Code */}
          <InputGroup
            label="GL Account Code"
            name="gl_account_code"
            register={register}
            required
            errors={errors}
            placeholder="Enter GL account code"
            maxLength={50}
            pattern={{
              value: /^[A-Za-z0-9_-]+$/,
              message: "Only letters, numbers, _ and - allowed",
            }}
          />

          {/* GL Account Name */}
          <InputGroup
            label="GL Account Name"
            name="gl_account_name"
            register={register}
            required
            errors={errors}
            placeholder="Enter GL account name"
            maxLength={100}
          />

          {/* GL Account Type */}
          <DropdownGroup
            label="GL Account Type"
            name="gl_account_type"
            options={accountTypes}
            register={register}
            required
            errors={errors}
          />
        </form>
      </div>
    </div>
  );
};

export default Form;
