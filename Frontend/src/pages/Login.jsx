import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, Label } from "../components/UI";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

const Login = () => {
  useEffect(() => {
    document.title = "NexaManage | Login";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || "",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const { data } = await api.post(
        "/organisations/login",
        { email, password: pass },
        { withCredentials: true },
      );

      if (!data.success || !data.user) {
        throw new Error(data.message || "Login failed");
      }

      const user = await initializeAuth({ force: true });
      if (!user) {
        throw new Error(
          "Login succeeded, but the browser did not accept the session cookie. If this browser blocks third-party cookies, configure the app and API on the same site or route API requests through the app's domain.",
        );
      }
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Login failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-(--glass-border) bg-(--glass-bg) p-6 shadow-[0_20px_60px_var(--shadow-color)] backdrop-blur-xl sm:p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm text-(--text-secondary) transition hover:text-(--primary)"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center ">
              <div className="grid size-12 place-items-center rounded-xl bg-(--primary) text-xl font-bold text-white shadow-[0_8px_20px_var(--shadow-color)]">
                N
              </div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-(--primary)">
                NexaManage
              </p>
            </div>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-(--text)">
            Welcome
          </h1>
          <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
            Log in to continue to your management workspace.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleLogin();
          }}
        >
          <div>
            <Label htmlFor="email" required>
              Email address
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3.5 text-(--text-muted)"
                size={17}
              />
              <Input
                id="email"
                type="email"
                className="pl-10"
                placeholder="you@example.com"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password" required>
              Password
            </Label>
            <div className="relative">
              <LockKeyhole
                className="absolute left-3 top-3.5 text-(--text-muted)"
                size={17}
              />
              <Input
                id="password"
                type="password"
                className="pl-10"
                placeholder="Enter your password"
                minLength={6}
                required
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-(--text-secondary)">
              <input type="checkbox" className="accent-(--primary)" /> Remember
              me
            </label>
            <button
              type="button"
              className="font-semibold text-(--primary) hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {errorMessage && (
            <p className="text-sm text-(--danger)" role="alert">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-green-700" role="status">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-(--primary) font-bold text-white shadow-[0_8px_20px_var(--shadow-color)] transition hover:bg-(--primary-hover)"
          >
            {isSubmitting ? "Logging in..." : "Log In"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-(--text-secondary)">
          New to NexaManage{" "}
          <button
            type="button"
            className="font-bold text-(--primary) hover:underline"
            onClick={() => navigate("/create/organisation")}
          >
            Create workspace
          </button>
        </p>
      </section>
    </main>
  );
};

// const getDashboardPath = (user) => {
//   if (user.organisation?.type === "SCHOOL") return "/school/dashboard";
//   if (user.role === "ADMIN") return "/dashboard";
//   return "/";
// };

export default Login;
