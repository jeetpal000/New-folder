import { useState } from "react";
import Login from "./Login";
import { AdminRegisterPage } from "../components/AdminRegister";
import OrganisationDetails from "../components/OrganisationDetail";
import SchoolProfile from "./school/SchoolProfile";
import { api } from "../services/api.js";
import { useNavigate } from "react-router-dom";

const CreatePage = () => {
  const [mode, setMode] = useState("register");

  return (
    <>
      {mode === "register" ? (
        <RegistrationForm />
      ) : (
        <Login onRegister={() => setMode("register")} />
      )}
    </>
  );
};
export default CreatePage;

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    admin: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
    organisation: {
      name: "",
      type: "",
      address: {
        state: "",
        city: "",
        street: "",
        pincode: "",
      },
      contact: {
        email: "",
        phone: "",
        website: "",
      },
    },
    profile: {},
  });

  const handleAdminNext = (values) => {
    const { confirmPassword, ...admin } = values;
    setFormData((prev) => ({
      ...prev,
      admin,
    }));
    setStep(2);
  };

  const handleOrganisationNext = (values) => {
    const nextFormData = {
      ...formData,
      organisation: values,
    };
    setFormData(nextFormData);
    setStep(3);
  };

  const handleProfileNext = async (profileData) => {
    const completeFormData = {
      ...formData,
      profile: profileData,
    };

    setFormData(completeFormData);
    setErrorMessage("");

    try {
      const response = await api.post(
        "/organisations/register",
        completeFormData,
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Workspace creation failed.");
      }
      navigate("/login", {
        replace: true,
        state: {
          message: "Your school workspace is ready. Log in to continue.",
        },
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Workspace creation failed. Please try again.",
      );
    }
  };

  return (
    <>
      {errorMessage && (
        <p
          className="mx-auto mt-4 max-w-3xl rounded-xl bg-red-500/10 p-4 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
      {step === 1 && (
        <AdminRegisterPage
          data={formData.admin}
          onNext={handleAdminNext}
          step={step}
        />
      )}
      {step === 2 && (
        <OrganisationDetails
          data={formData.organisation}
          onNext={handleOrganisationNext}
          onBack={() => setStep(1)}
          step={step}
        />
      )}

      {step === 3 && (
        <SchoolProfile
          data={formData.profile}
          onNext={handleProfileNext}
          onBack={() => setStep(2)}
          step={step}
        />
      )}

      {/* {submittedData && (
        <section className="mx-auto mb-10 max-w-3xl px-4 sm:px-6">
          <h2 className="mb-2 text-lg font-bold text-(--text)">
            Register form data
          </h2>
          <pre className="overflow-x-auto rounded-xl border border-(--glass-border) bg-(--glass-bg) p-4 text-xs text-(--text-secondary)">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </section>
      )} */}
    </>
  );
};
