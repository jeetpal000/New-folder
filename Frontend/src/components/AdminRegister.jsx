import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserLock,
  UserPen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input, Label } from "./UI";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminSchema } from "../schema/registrationSchema";

export const AdminRegisterPage = ({ data, onNext, step }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = `NexaManage |  setup`;
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: data,
  });

  const handleValid = (values) => {
    onNext(values);
  };
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 relative">
      <section className="rounded-2xl border border-(--glass-border) bg-(--glass-bg) p-6 shadow-[0_20px_60px_var(--shadow-color)] backdrop-blur-xl sm:p-9">
        {/* <div className="px-5 relative"> */}
        <div className="relative -top-5 bg-(--text-muted) w-full h-2 rounded-full overflow-hidden">
          <div
            className="bg-(--primary) h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
          <span className="absolute left-1/2 -top-1/6 font-bold text-[8px] text-center">
            {step}/3
          </span>
        </div>
        {/* </div> */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm text-(--text-secondary) transition hover:text-(--primary)"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="mb-8 flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--primary) text-white">
            <UserLock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-(--primary)">
              Create workspace
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-(--text)">
              Admin details
            </h1>
            <p className="mt-2 text-sm text-(--text-secondary)">
              Add the basic details to get your workspace ready.
            </p>
          </div>
        </div>
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={handleSubmit(handleValid)}
        >
          <div>
            <Label htmlFor="name" required>
              Name
            </Label>
            <div className="relative">
              <UserPen
                className="absolute left-3 top-3.5 text-(--text-muted)"
                size={17}
              />
              <Input
                id="name"
                type="text"
                placeholder="Enter name"
                required
                className="pl-10"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-(--danger) mt-2 text-xs">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>
          <div className="">
            <Label htmlFor="email" required>
              Email
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3.5 text-(--text-muted)"
                size={17}
              />
              <Input
                id="email"
                type="text"
                placeholder="Enter email"
                required
                className="pl-10"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-(--danger) mt-2 text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>
          <div className="">
            <Label htmlFor="phone" required>
              Phone Number
            </Label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-3.5 text-(--text-muted)"
                size={17}
              />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                required
                className="pl-10"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-(--danger) mt-2 text-xs">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="workspace-password" required>
              Admin password
            </Label>
            <div className="relative">
              <LockKeyhole
                className="absolute left-3 top-3.5 text-(--text-muted) "
                size={17}
              />
              <Input
                id="workspace-password"
                type={showPassword ? "text" : "password"}
                minLength={6}
                placeholder="Create a secure password"
                required
                className="pl-10"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-(--text-muted)"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>

              {errors.password && (
                <p className="text-(--danger) mt-2 text-xs text-shadow-2xs">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-workspace-password" required>
              Confirm password
            </Label>
            <div className="relative">
              <LockKeyhole
                className="absolute left-3 top-3.5 text-(--text-muted)"
                size={17}
              />
              <Input
                id="confirm-workspace-password"
                type={showConfirmPassword ? "text" : "password"}
                minLength={6}
                placeholder="Repeat your password"
                required
                className="pl-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-(--text-muted)"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
              {errors.confirmPassword && (
                <p className="text-(--danger) mt-2 text-xs">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 flex h-11 items-center justify-center rounded-lg bg-(--primary) font-bold text-white transition hover:bg-(--primary-hover) sm:col-span-2"
          >
            Save & Next
          </button>
        </form>
      </section>
    </main>
  );
};
