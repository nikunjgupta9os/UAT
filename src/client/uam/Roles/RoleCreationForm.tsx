import Layout from "../../common/Layout";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
import Button from "../../ui/Button";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../Notification/Notification";
// type FormData = {
//   processname: string;
//   authenticationType: string;
//   employeeName: string;
//   usernameOrEmployeeId: string;
//   roleName: string;
//   email: string;
//   mobile: string;
//   address: string;
//   businessUnitName: string;
//   officeStartTimeIST: string;
//   officeEndTimeIST: string;
// };
const RoleCreation: React.FC = () => {
  const navigate = useNavigate();
  // const { reset } = useForm<FormData>();
  const [roles, setRoles] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [timeError, setTimeError] = useState("");
  const { notify } = useNotification();

  const onReset = () => {
    setForm({
      name: "",
      description: "",
      startTime: "",
      endTime: "",
      isOvernight: false,
    });
    setFormError("");
    setTimeError("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.description || !form.startTime || !form.endTime) {
      setFormError("All fields are required.");
      return;
    }

    if (!form.isOvernight && form.startTime >= form.endTime) {
      setTimeError("Start time must be before end time.");
      return;
    }

    setFormError("");
    setTimeError("");

    const payload = {
      name: form.name,
      rolecode: form.name.toUpperCase().trim(),
      description: form.description,
      office_start_time_ist: form.startTime,
      office_end_time_ist: form.endTime,
      created_by: localStorage.getItem("userEmail"),
    };

    axios
      .post("https://backend-slqi.onrender.com/api/roles/create", payload)
      .then((res) => {
        if (res.data.success) {
          setRoles((prev) =>
            [...prev, res.data.role].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          );
          setForm({
            name: "",
            description: "",
            startTime: "",
            endTime: "",
            isOvernight: false,
          });
          // setShowForm(false);
          // alert("Role created successfully!");
          notify("Role created successfully!", "success");
          navigatee("/role");
        } else {
          // alert(
          //   "Failed to create role: " + (res.data.error || "Unknown error.")
          // );
          notify(
            "Failed to create role: " + (res.data.error || "Unknown error."),
            "error"
          );
        }
      })
      .catch(() => {
        //  console.error("Error creating role:", err);
        // alert("Failed to create role.");
        notify("Failed to create role.", "error");
      });
  };
  const PageChange = () => {
    navigate("/role");
  };

  const [form, setForm] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    isOvernight: false,
  });
  const navigatee = useNavigate();
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Handle checkbox for isOvernight
    if (name === "isOvernight" && e.target.type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        isOvernight: (e.target as HTMLInputElement).checked,
      }));
      // Clear time error if overnight is checked
      if ((e.target as HTMLInputElement).checked) {
        setTimeError("");
      } else if (
        form.startTime &&
        form.endTime &&
        form.startTime >= form.endTime
      ) {
        setTimeError("Start time must be before end time.");
      } else {
        setTimeError("");
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));

    if (
      (name === "startTime" || name === "endTime") &&
      form.startTime &&
      form.endTime
    ) {
      if (
        !form.isOvernight &&
        (name === "startTime" ? value : form.startTime) >=
          (name === "endTime" ? value : form.endTime)
      ) {
        setTimeError("Start time must be before end time.");
      } else {
        setTimeError("");
      }
    }
  };

  return (
    <Layout
      title="Role Creation Form"
      showButton={true}
      buttonText="Back"
      onButtonClick={PageChange}
      buttonColor="NonPrimary"
    >
      <div className="flex justify-center">
        <div className="p-6 rounded-xl border text-secondary-text border-border bg-secondary-color-lt shadow-md space-y-6 flex-shrink-0 w-full max-w-[1500px]">
          <h2 className="text-xl font-semibold text-secondary-text">
            Create User Form
          </h2>
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="block font-semibold mb-1">
                Role Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full text-secondary-text bg-secondary-color-lt px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block font-semibold mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full text-secondary-text bg-secondary-color-lt px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
                required
              />
            </div>

            <div className="mb-3 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block font-semibold mb-1">
                  Office Start Time (IST){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full text-secondary-text bg-secondary-color-lt px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="block font-semibold mb-1">
                  Office End Time (IST) <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full text-secondary-text bg-secondary-color-lt px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
                  required
                />

                {/* Overnight checkbox */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overnight"
                    name="isOvernight"
                    checked={form.isOvernight}
                    onChange={handleChange}
                    className="accent-blue-600"
                  />
                  <label
                    htmlFor="overnight"
                    className="text-sm text-secondary-text"
                  >
                    End time is next day (overnight shift)
                  </label>
                </div>
              </div>
            </div>

            {timeError && <div className="text-red-600 mb-2">{timeError}</div>}
            {formError && <div className="text-red-600 mb-2">{formError}</div>}

            <div className="flex justify-end gap-2 mt-4">
              <div className="flex gap-4">
                <Button
                  color="Fade"
                  categories="Large"
                  onClick={onReset}
                >
                  Reset
                </Button>
                <Button type="submit" color="Green" categories="Large">
                  Submit
                </Button>
              </div>
            </div>
          </form>
        </div>
        {roles && <div></div>}
      </div>
    </Layout>
  );
};

export default RoleCreation;
