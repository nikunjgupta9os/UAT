import Layout from "../../common/Layout";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Button from "../../ui/Button";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNotification } from "../../Notification/Notification.tsx";

type FormData = {
  processname: string;
  authenticationType: string;
  employeeName: string;
  usernameOrEmployeeId: string;
  roleName: string;
  email: string;
  mobile: string;
  address: string;
  businessUnitName: string;
  officeStartTimeIST: string;
  officeEndTimeIST: string;
};
const UserCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [roles, setRoles] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [businessUnits, setBusinessUnits] = useState<string[]>([]);

  // const [form, setForm] = useState<FormData[]>([]);
  // console.log("Form data:", formError, timeError);
  useEffect(() => {
    axios
      .get("https://backend-slqi.onrender.com/api/entity/names")
      .then(({ data }) => {
        setBusinessUnits(data); // assuming response is already an array of strings
      })
      .catch((err) => {
        console.error("Error fetching entity names:", err);
      });
  }, []);

  useEffect(() => {
    axios
      .get("https://backend-slqi.onrender.com/roles/roles")
      .then(({ data }) => {
        const roles = data.roles.map((role: string) => role);
        setRoles(roles);
        // console.log(roles);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  }, []);

  const onReset = () => {
    reset();
  };

  const onSubmit = (data: FormData) => {
    const {
      authenticationType,
      employeeName,
      roleName,
      usernameOrEmployeeId,
      email,
      mobile,
      address,
      businessUnitName,
    } = data;

    if (!mobile || !address || !businessUnitName) {
      setFormError("All fields are required.");
      return;
    }

    setFormError("");
    setTimeError("");

    const payload = {
      authentication_type: authenticationType,
      employee_name: employeeName,
      role: roleName,
      username_or_employee_id: usernameOrEmployeeId,
      email,
      mobile,
      address,
      business_unit_name: businessUnitName,
      created_by: localStorage.getItem("userEmail"),
    };
    console.log(payload);

    axios
      .post("https://backend-slqi.onrender.com/api/users/create", payload)
      .then((res) => {
        if (res.data.success) {
          // alert("User created successfully!");
          notify("User created successfully!", "success");
          reset(); // Clear the form
          navigate("/user");
        } else {
          // alert("Failed to create user: " + (res.data.error || "Unknown error."));
          notify(
            "Failed to create user: " + (res.data.error || "Unknown error."),
            "warning"
          );
        }
      })
      .catch((err) => {
        console.error("Error creating user:", err);
        // alert("Failed to create user.");
        notify("Error creating user.", "error");
      });
  };

  const PageChange = () => {
    navigate("/user");
  };

  const { notify } = useNotification();

  return (
    <Layout
      title="User Creation Form"
      showButton={true}
      buttonText="Back"
      onButtonClick={PageChange}
      buttonColor="NonPrimary"
    >
      <div className="flex justify-center">
        <div className="p-6 rounded-xl border border-border bg-secondary-color-lt  shadow-md space-y-6 flex-shrink-0 w-full max-w-[1500px]">
          <h2 className="text-xl font-semibold text-secondary-text">
            Create User Form
          </h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-x-6 gap-y-4 flex-shrink-0"
          >
            <input
              type="hidden"
              value="initiatecreateuser"
              {...register("processname")}
            />

            <div>
              <label className="text-secondary-text">
                Authentication Type<span className="text-red-500">*</span>
              </label>
              <select
                defaultValue="LDAP"
                {...register("authenticationType", {
                  required: "Please select your authentication type.",
                })}
                className="w-full p-2 border rounded text-secondary-text bg-secondary-color-lt border-border"
              >
                <option value="ADFS">ADFS</option>
                <option value="LDAP">LDAP</option>
                <option value="CImplr">CImplr</option>
              </select>
            </div>

            <div>
              <label className="text-secondary-text">
                Employee Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("employeeName", {
                  required: "Please enter your employee name.",
                })}
                placeholder="Please enter your first employee name."
                className="w-full p-2 border rounded text-secondary-text bg-secondary-color-lt border-border"
              />
            </div>

            <div>
              <label className="text-secondary-text">
                Username / Employee ID<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("usernameOrEmployeeId", {
                  required: "Please enter your username or employee ID.",
                })}
                className="w-full p-2 border rounded text-secondary-text bg-secondary-color-lt border-border"
              />
            </div>

            <div>
              <label className="text-secondary-text">Role Name</label>
              <select
                {...register("roleName", {
                  required: "Please enter your role name.",
                })}
                className="w-full p-2 border rounded text-secondary-text bg-secondary-color-lt border-border"
              >
                <option value="" disabled hidden selected>
                  Select Role
                </option>
                {roles.map((role, index) => (
                  <option key={index} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-secondary-text">Email</label>
              <input
                type="email"
                {...register("email", {
                  required: "Please enter your email.",
                })}
                className="w-full p-2 border rounded text-secondary-text bg-secondary-color-lt border-border"
              />
            </div>

            <div>
              <label className="text-secondary-text">Mobile</label>
              <input
                type="tel"
                {...register("mobile", { value: "" })}
                className="w-full p-2 border rounded text-secondary-text bg-secondary-color-lt border-border"
              />
            </div>

            <div>
              <label className="text-secondary-text">Address</label>
              <input
                type="text"
                {...register("address", { value: "" })}
                className="w-full p-2 border rounded text-secondary-text bg-secondary-color-lt border-border"
              />
            </div>

            <div>
              <label className="text-secondary-text">Business Unit Name</label>
              <select
                {...register("businessUnitName", {
                  required: "Please select a business unit.",
                })}
                className="w-full p-2 border rounded text-secondary-text bg-secondary-color-lt border-border"
              >
                <option value="" disabled hidden selected>
                  Select Business Unit
                </option>
                {businessUnits.map((bu, index) => (
                  <option key={index} value={bu}>
                    {bu}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 flex justify-end gap-4 mt-4">
              <div className="flex gap-4">
                <Button type="button" color="Fade" categories="Large" onClick={onReset}>
                  <span>Reset</span>
                </Button>
                <Button type="submit" categories="Large">
                  <span className="text-white">Submit</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
        {formError && <div></div>}
        {timeError && <div></div>}
      </div>
    </Layout>
  );
};

export default UserCreationForm;
