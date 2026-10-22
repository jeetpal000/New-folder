import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { organisationSchema } from "../schema/registrationSchema";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2Icon,
  Link,
  Mail,
  MapPin,
  Phone,
  SquareCode,
  UserPen,
} from "lucide-react";
import { Input, Label, Select } from "./UI";

const OrganisationDetails = ({ data, onNext, onBack, step }) => {
  useEffect(() => {
    document.title = `NexaManage |  setup`;
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(organisationSchema),
    defaultValues: data ?? {},
  });

  const handleValid = (values) => {
    onNext(values);
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 relative">
      <section className="rounded-2xl border border-(--glass-border) bg-(--glass-bg) p-6 shadow-[0_20px_60px_var(--shadow-color)] backdrop-blur-xl sm:p-9">
        <div className="relative -top-5 bg-(--text-muted) w-full h-2 rounded-full overflow-hidden">
          <div
            className="bg-(--primary) h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
          <span className="absolute left-1/2 -top-1/6 font-bold text-[8px] text-center">
            {step}/3
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm text-(--text-secondary) transition hover:text-(--primary)"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="mb-8 flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--primary) text-white">
            <Building2Icon size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-(--primary)">
              Create workspace
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-(--text)">
              School address details
            </h1>
            <p className="mt-2 text-sm text-(--text-secondary)">
              Add the organisation details to get your workspace ready.
            </p>
          </div>
        </div>
        <form
          className="grid grid-cols-2 gap-5"
          onSubmit={handleSubmit(handleValid)}
        >
          <div className="col-span-2">
            <Label htmlFor="name" required>
              School Name
            </Label>
            <div className="relative">
              <UserPen
                className="absolute left-3 top-3.5 text-(--text-muted)"
                size={17}
              />
              <Input
                id="name"
                type="text"
                placeholder={`Enter School name`}
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

          {/* <h1 className="font-semibold pb-2 col-span-1">Address</h1> */}

          <div className="">
            <Label htmlFor="state" required>
              Select State
            </Label>
            <Select name="state" id="state" {...register("address.state")}>
              <option value="">Select State</option>
              <option
                className="bg-(--primary-soft) border border-(--border) rounded-xl"
                value="Uttar Pradesh"
              >
                UP
              </option>
              <option value="MP">MP</option>
            </Select>
          </div>
          <div className="">
            <Label htmlFor="city" required>
              Select City
            </Label>
            <Select name="city" id="city" {...register("address.city")}>
              <option value="">Select City</option>
              <option value="Jaunpur">Jaunpur</option>
              <option value="Prayagraj">Prayagraj</option>
            </Select>
          </div>

          <div className="">
            <Label htmlFor="street" required>
              Street
            </Label>
            <div className="relative">
              <MapPin
                size={17}
                className="absolute top-3.5 left-3 text-(--text-muted)"
              />
              <Input
                id="street"
                type="text"
                placeholder="Enter address"
                required
                className="pl-10"
                {...register("address.street")}
              />
              {errors.address?.street && (
                <p className="text-(--danger) mt-2 text-xs">
                  {errors.address.street.message}
                </p>
              )}
            </div>
          </div>
          <div className="">
            <Label htmlFor="pincode" required>
              Pin Code
            </Label>
            <div className="relative">
              <SquareCode
                size={17}
                className="absolute top-3.5 left-3 text-(--text-muted)"
              />
              <Input
                id="pincode"
                type="text"
                placeholder="Enter postal code"
                required
                className="pl-10"
                {...register("address.pincode")}
              />
              {errors.address?.pincode && (
                <p className="text-(--danger) mt-2 text-xs">
                  {errors.address.pincode.message}
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
                {...register("contact.email")}
              />
              {errors.contact?.email && (
                <p className="text-(--danger) mt-2 text-xs">
                  {errors.contact.email.message}
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
                {...register("contact.phone")}
              />
              {errors.contact?.phone && (
                <p className="text-(--danger) mt-2 text-xs">
                  {errors.contact.phone.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Link
                className="absolute left-3 top-3.5 text-(--text-muted) "
                size={17}
              />
              <Input
                id="website"
                type="text"
                minLength={6}
                placeholder="Enter website url"
                className="pl-10"
                {...register("contact.website")}
              />
              {errors.contact?.website && (
                <p className="text-(--danger) mt-2 text-xs text-shadow-2xs">
                  {errors.contact.website.message}
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

export default OrganisationDetails;
