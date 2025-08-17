import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Layout from "../common/Layout";
// import { no } from "zod/v4/locales";
import Button from "../ui/Button";
import { useNotification } from "../Notification/Notification.tsx";

const entityTypes = ["Legal", "Non-Legal"];
const entities = ["Choose...", "Level 1", "Level 2", "Level 3", "Level 4"];
const currencies = ["INR", "USD", "EUR", "GBP"];
const fxMandates = ["Yes", "No"];
const legalEntityTypes = ["Private Ltd", "Public Ltd", "LLP", "Others"];

const InputGroup = ({
  label,
  name,
  register,
  required = false,
  type = "text",
  placeholder,
}: any) => (
  <div>
    <label className="text-secondary-text">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type={type}
      {...register(name, { required })}
      className="w-full p-2 border border-border bg-secondary-color-lt text-secondary-text outline-none rounded"
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
    />
  </div>
);

const DropdownGroup = ({
  label,
  name,
  options,
  register,
  required = false,
  onChange,
}: any) => (
  <div>
    <label className="text-secondary-text">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <select
      {...register(name, { required })}
      onChange={(e) => {
        register(name).onChange?.(e);
        onChange?.(e);
      }}
      className="w-full p-2 border border-border bg-secondary-color-lt text-secondary-text outline-none rounded"
    >
      <option value="" disabled hidden>
        Select {label}
      </option>
      {options.map((opt: string, idx: number) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const EntityCreation: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm();

  const [level, setLevel] = useState(0);
  const [parentOptions, setParentOptions] = useState<string[]>([]);
  const [legal, setLegal] = useState(true);
  const [formData, setFormData] = useState<any>(null); // for useEffect logging
  const { notify } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const PageChange = useCallback(() => {
    navigate("/entity");
  }, [navigate]);

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLevel = e.target.value;
    if (selectedLevel === "Choose...") setLevel(0);
    else {
      const levelNumber = parseInt(selectedLevel.split(" ")[1], 10);
      if (!isNaN(levelNumber)) setLevel(levelNumber);
    }
  };

  const handleEntityTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLegal(e.target.value === "Legal");
  };

  const onSubmit = async (data: any) => {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    // Prepare JSON object based on the spec
    const payload = {
      entity_name: data.entityName || null,
      parentname: level > 1 ? data.parent || null : null,
      is_top_level_entity: level === 1,
      address: data.address || null,
      companny_name : data.companyName || null,
      contact_phone: data.contact || null,
      contact_email: data.contactEmail || null,
      registration_number: legal ? data.registerNumber || null : null,
      pan_gst: legal ? data.panGst || null : null,
      legal_entity_identifier: legal ? data.lei || null : null,
      tax_identification_number: legal ? data.tin || null : null,
      default_currency: data.defaultCurrency || null,
      associated_business_units: data.businessUnit ? [data.businessUnit] : [],
      reporting_currency: data.reportingCurrency || null,
      unique_identifier: data.uniqueIdentifier || null,
      legal_entity_type: data.legalEntityType || null,
      fx_trading_authority: data.fxMandate || null,
      internal_fx_trading_limit: data.fxLimit ? parseFloat(data.fxLimit) : null,
      associated_treasury_contact: data.treasuryDesk || null,
      is_deleted: false,
      approval_status: "Pending",
      level: data.entity || null,
    };

    // Store data in state for logging in useEffect
    setFormData(payload);

    // Send API request
    try {
      const response = await fetch(
        "https://backend-slqi.onrender.com/api/entity/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      //  console.log("API response:", result);
      // notify("Entity created successfully!", "success");
      notify("Entity created successfully!", "success");
    } catch (error) {
      console.error("API Error:", error);
    }

    // Reset form
    reset();
    setLevel(0);
    setLegal(true);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!level || level <= 1) {
      setParentOptions([]);
      return;
    }

    const parentLevel = level;
    // const timestamp = new Date().getTime(); // cache buster
    console.log(level);

    axios
      .get(
        `https://backend-slqi.onrender.com/api/entity/findParentAtLevel/${parentLevel}`
      )
      .then((res) => {
        if (Array.isArray(res.data)) {
          const uniqueNames = [
            ...new Set(res.data.map((e) => e.entity_name).filter(Boolean)),
          ];
          setParentOptions(uniqueNames);
          console.log("Fetched parent options:", uniqueNames);
        } else {
          setParentOptions([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching parent entities:", err);
        setParentOptions([]);
      });
  }, [level]);

  // Log to  console when formData updates
  useEffect(() => {
    if (formData) {
      console.log("Generated Payload to Send:", formData);
    }
  }, [formData]);

  return (
    <Layout
      title="Entity Creation"
      // showButton
      // buttonText="Back"
      // onButtonClick={PageChange}
    >
      <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-[1500px]">
        <h2 className="text-xl font-semibold text-secondary-text-dark">Entity User Form</h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          <input
            type="hidden"
              value="initiatecreateentity"
              {...register("processname")}
            />

            <InputGroup
              label="Company Name (Full Name)"
              name="companyName"
              register={register}
              required
            />
            

            <InputGroup
              label="Company / Entity Name"
              name="entityName"
              register={register}
              required
            />
            
            <DropdownGroup
              label="Entity Level"
              name="entity"
              options={entities}
              register={register}
              required
              onChange={handleEntityChange}
            />

            {level === 1 && (
              <>
                <DropdownGroup
                  label="Entity Type"
                  name="entityType"
                  options={entityTypes}
                  register={register}
                  required
                  onChange={handleEntityTypeChange}
                />
                <InputGroup
                  label="Address"
                  name="address"
                  register={register}
                  required
                />
                <InputGroup
                  label="Contact"
                  name="contact"
                  register={register}
                  required
                />
                <InputGroup
                  label="Contact Email"
                  name="contactEmail"
                  register={register}
                  type="email"
                  required
                />
                <DropdownGroup
                  label="Default Currency"
                  name="defaultCurrency"
                  options={currencies}
                  register={register}
                  required
                />
                <InputGroup
                  label="Associated Business Unit"
                  name="businessUnit"
                  register={register}
                  required
                />
                <DropdownGroup
                  label="Reporting Currency"
                  name="reportingCurrency"
                  options={currencies}
                  register={register}
                  required
                />
                {legal && (
                  <>
                    <InputGroup
                      label="Register Number"
                      name="registerNumber"
                      register={register}
                      required
                    />
                    <InputGroup
                      label="PAN/GST"
                      name="panGst"
                      register={register}
                      required
                    />
                    <InputGroup
                      label="LEI"
                      name="lei"
                      register={register}
                      required
                    />
                    <InputGroup
                      label="TIN"
                      name="tin"
                      register={register}
                      required
                    />
                  </>
                )}
              </>
            )}

            {level > 1 && (
              <>
                <DropdownGroup
                  label="Parent"
                  name="parent"
                  options={parentOptions}
                  register={register}
                  required
                />
                <InputGroup
                  label="Address"
                  name="address"
                  register={register}
                  required
                />
                <InputGroup
                  label="Contact"
                  name="contact"
                  register={register}
                  required
                />
                <InputGroup
                  label="Contact Email"
                  name="contactEmail"
                  register={register}
                  type="email"
                  required
                />
                <DropdownGroup
                  label="Default Currency"
                  name="defaultCurrency"
                  options={currencies}
                  register={register}
                  required
                />
                <DropdownGroup
                  label="FX Trading Authority/Mandate"
                  name="fxMandate"
                  options={fxMandates}
                  register={register}
                  required
                />
                <DropdownGroup
                  label="Legal Entity Type"
                  name="legalEntityType"
                  options={legalEntityTypes}
                  register={register}
                  required
                />
                <InputGroup
                  label="Internal FX Trading Limit (in USD)"
                  name="fxLimit"
                  register={register}
                  type="number"
                  placeholder="Enter amount in USD"
                  required
                />
                <InputGroup
                  label="Associated Treasury Desk/Contact"
                  name="treasuryDesk"
                  register={register}
                  required
                />
                <InputGroup
                  label="Unique Identifier (within Group)"
                  name="uniqueIdentifier"
                  register={register}
                  required
                />
              </>
            )}

            <div className="col-span-3 flex justify-end">
              <div className="w-[8rem]">
                <Button
                  // categories="Large"
                  type="submit"
                  disabled={isSubmitting}
                  // className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EntityCreation;
