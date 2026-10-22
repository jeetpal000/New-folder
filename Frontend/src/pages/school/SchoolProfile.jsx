import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2Icon } from "lucide-react";
import { useParams } from "react-router-dom";
import { Label, Select } from "../../components/UI";
import { Input } from "../../components/UI";
import { schoolProfileSchema } from "../../schema/registrationSchema";

const SchoolProfile = ({ data, onNext, onBack, step }) => {
  const facilities = [
    "Library",
    "Science laboratory",
    "Computer laboratory",
    "Sports ground",
    "Transport",
    "Cafeteria",
    "Smart classrooms",
    "Medical room",
    "Hostel",
    "CCTV security",
  ];
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: data ?? {},
  });
  const selectedFacilities = watch("facilities") || [];

  useEffect(() => {
    document.title = "NexaManage | School setup";
  }, []);

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
              School profile details
            </h1>
            <p className="mt-2 text-sm text-(--text-secondary)">
              Add the organisation details to get your workspace ready.
            </p>
          </div>
        </div>
        <form
          className="grid grid-cols-2 gap-5"
          onSubmit={handleSubmit(onNext)}
        >
          <div>
            <Label htmlFor="schoolType" required>
              School Type
            </Label>
            <Select id="schoolType" {...register("schoolType")}>
              <option value="">Select school type</option>
              <option value="PRIVATE">Private</option>
              <option value="GOVERNMENT">Government</option>
              <option value="PRIVATE_AIDED">Private aided</option>
            </Select>
            {errors.schoolType && (
              <p className="mt-2 text-xs text-(--danger)">
                {errors.schoolType.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="board" required>
              Board
            </Label>
            <Select id="board" {...register("board")}>
              <option value="">Select board</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="UP-BOARD">UP Board</option>
            </Select>
            {errors.board && (
              <p className="mt-2 text-xs text-(--danger)">
                {errors.board.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="principalName" required>
              Principal name
            </Label>
            <Input id="principalName" {...register("principalName")} />
          </div>
          <div>
            <Label htmlFor="affiliationNumber" required>
              Affiliation number
            </Label>
            <Input id="affiliationNumber" {...register("affiliationNumber")} />
          </div>
          <div>
            <Label htmlFor="academicSession" required>
              Academic session
            </Label>
            <Input id="academicSession" {...register("academicSession")} />
          </div>
          <div>
            <Label htmlFor="establishedYear" required>
              Established year
            </Label>
            <Input
              id="establishedYear"
              type="number"
              {...register("establishedYear")}
            />
            {errors.establishedYear && (
              <p className="mt-2 text-xs text-(--danger)">
                {errors.establishedYear.message}
              </p>
            )}
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-3 text-sm font-semibold text-(--text)">
              School facilities
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {facilities.map((facility) => (
                <label
                  key={facility}
                  className="flex items-center gap-2 rounded-lg border border-(--border) p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    value={facility}
                    {...register("facilities")}
                    className="accent-(--primary)"
                  />
                  {facility}
                </label>
              ))}
            </div>
            {selectedFacilities.length === 0 && (
              <p className="mt-2 text-xs text-(--text-muted)">
                Select the facilities available at the school; these appear on
                the public school profile.
              </p>
            )}
          </fieldset>
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

export default SchoolProfile;
