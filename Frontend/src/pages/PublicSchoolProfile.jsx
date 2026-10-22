import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  GraduationCap,
  Search,
  UsersRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Input, Select, Textarea } from "../components/UI";

const PublicSchoolProfile = () => {
  const { slug } = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState("admission");
  const [student, setStudent] = useState(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [leaveMessage, setLeaveMessage] = useState("");
  const [admissionMessage, setAdmissionMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [lookupIdentity, setLookupIdentity] = useState(null);

  const loadSchool = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/directory/schools/${encodeURIComponent(slug)}`,
      );
      setSchool(response.data.school);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "School profile could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadSchool();
  }, [loadSchool]);

  useEffect(() => {
    if (school) document.title = `NexaManage | ${school.schoolName}`;
  }, [school]);

  const lookupStudent = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identity = {
      rollNumber: String(form.get("rollNumber")).trim(),
      classId: String(form.get("classId")),
      dateOfBirth: form.get("dateOfBirth"),
    };
    setBusy(true);
    setLookupMessage("");
    setLeaveMessage("");
    setStudent(null);
    setLookupIdentity(null);
    try {
      const response = await api.post(
        `/directory/schools/${encodeURIComponent(slug)}/students/lookup`,
        identity,
      );
      setStudent(response.data.student);
      setLookupIdentity(identity);
    } catch (requestError) {
      setLookupMessage(
        requestError.response?.data?.message ||
          "Student details could not be verified.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitLeave = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setLeaveMessage("");
    try {
      const response = await api.post(
        `/directory/schools/${encodeURIComponent(slug)}/leaves`,
        {
          ...lookupIdentity,
          fromDate: form.get("fromDate"),
          toDate: form.get("toDate"),
          reason: form.get("reason"),
          guardianPhone: form.get("guardianPhone"),
        },
      );
      setLeaveMessage(response.data.message);
    } catch (requestError) {
      setLeaveMessage(
        requestError.response?.data?.message ||
          "Leave request could not be submitted.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitAdmission = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setAdmissionMessage("");
    try {
      const response = await api.post(
        `/directory/schools/${encodeURIComponent(slug)}/admissions`,
        Object.fromEntries(form.entries()),
      );
      setAdmissionMessage(response.data.message);
      formElement.reset();
    } catch (requestError) {
      setAdmissionMessage(
        requestError.response?.data?.message ||
          "Admission application could not be submitted.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center text-(--text-muted)">
        Loading school profile…
      </main>
    );
  }
  if (error || !school) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">School profile unavailable</h1>
        <p role="alert" className="text-sm text-red-600">
          {error || "School not found"}
        </p>
        <Link className="font-semibold text-(--primary)" to="/">
          Return to school search
        </Link>
      </main>
    );
  }

  const panels = [
    ["admission", "Apply for admission"],
    ["leave", "Student profile / leave"],
  ];
  const highlightCategories = [
    ["feature", "School features"],
    ["award", "Awards & achievements"],
    ["picnic", "Picnics & activities"],
    ["tour", "Educational tours"],
    ["function", "Events & functions"],
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-7 px-4 py-6 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-(--text-muted) hover:text-(--primary)"
      >
        <ArrowLeft size={17} />
        Search schools
      </Link>

      <header className="rounded-3xl border border-(--border) bg-(--primary-soft) backdrop-blur-md p-6 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-(--primary-soft) text-(--primary)">
              {school.logo ? (
                <img
                  src={school.logo}
                  alt=""
                  className="size-14 rounded-2xl object-cover"
                />
              ) : (
                <Building2 size={26} />
              )}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--primary)">
                School profile
              </p>
              <h1 className="mt-1 text-3xl font-extrabold">
                {school.schoolName}
              </h1>
              <p className="mt-2 text-sm text-(--text-muted)">
                {[
                  school.schoolType?.replaceAll("_", " "),
                  school.board,
                  school.city,
                  school.state,
                ]
                  .filter(Boolean)
                  .join("▪️")}
              </p>
              {school.address && (
                <p className="mt-2 text-sm">
                  {[school.address, school.city, school.state, school.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-80">
            <ProfileMetric
              icon={UsersRound}
              label="Staff"
              value={school.staffCount}
            />
            <ProfileMetric
              icon={GraduationCap}
              label="Teachers"
              value={school.teacherCount}
            />
            <ProfileMetric
              icon={Building2}
              label="Classes"
              value={school.classCount}
            />
          </div>
        </div>

        <div className="mt-7 grid gap-6 border-t border-(--border) pt-6 md:grid-cols-2">
          <section>
            <h2 className="font-bold">School details</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              {school.principalName && (
                <Detail label="Principal" value={school.principalName} />
              )}
              {school.academicSession && (
                <Detail
                  label="Academic session"
                  value={school.academicSession}
                />
              )}
              {school.establishedYear && (
                <Detail label="Established" value={school.establishedYear} />
              )}
              {school.schoolEmail && (
                <Detail label="Email" value={school.schoolEmail} />
              )}
              {school.schoolPhone && (
                <Detail label="Phone" value={school.schoolPhone} />
              )}
            </dl>
          </section>
          <section>
            <h2 className="font-bold">Facilities available</h2>
            {school.facilities?.length ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {school.facilities.map((facility) => (
                  <li
                    key={facility}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-emerald-600"
                    />
                    {facility}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-(--text-muted)">
                The school has not listed its facilities yet.
              </p>
            )}
          </section>
        </div>

        <section className="mt-6 border-t border-(--border) pt-6">
          <h2 className="font-bold">Classes, sections & subjects</h2>
          {school.classes?.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {school.classes.map((item) => (
                <article
                  key={item._id}
                  className="rounded-xl border border-(--border) bg-linear-125 from-(--card-gradient-1)/50 to-(--card-gradient-2)/10 p-4"
                >
                  <h3 className="font-semibold">
                    {item.name} · Section {item.section}
                  </h3>
                  {item.course && (
                    <p className="mt-1 text-xs text-(--text-muted)">
                      {item.course}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
                    Subjects
                  </p>
                  {item.subjects?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-(--glass-bg) px-2.5 py-1 text-xs"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-(--text-muted)">
                      Not listed yet
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-(--text-muted)">
              Class details are not available yet.
            </p>
          )}
        </section>
        {highlightCategories.map(([category, title]) => {
          const highlights =
            school.publicHighlights?.filter(
              (item) => item.category === category,
            ) || [];
          if (!highlights.length) return null;
          return (
            <section
              key={category}
              className="mt-6 border-t border-(--border) pt-6"
            >
              <h2 className="font-bold">{title}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((item) => (
                  <article
                    key={item._id || `${category}-${item.title}`}
                    className="overflow-hidden rounded-2xl border border-(--border) bg-(--primary-soft-hover)"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="h-48 w-full object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.description && (
                        <p className="mt-2 whitespace-pre-line text-sm text-(--text-muted)">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </header>

      <section className="rounded-3xl border border-(--border) bg-(--primary-soft) backdrop-blur-md p-5 sm:p-8">
        <div className="flex flex-wrap gap-2 border-b border-(--border) pb-4">
          {panels.map(([id, title]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActivePanel(id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                activePanel === id
                  ? "bg-(--primary) text-white"
                  : "bg-(--primary-soft-hover) text-(--text)"
              }`}
            >
              {title}
            </button>
          ))}
        </div>

        {activePanel === "admission" ? (
          <div className="mx-auto mt-6 max-w-3xl">
            <h2 className="text-xl font-bold">Admission application</h2>
            {!school.admissionOpen ? (
              <p className="mt-4 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-800">
                Admissions are currently closed. Please contact the school for
                more information.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-(--text-muted)">
                  Submit student and guardian details. The school admin reviews
                  each application before enrolment.
                </p>
                {admissionMessage && (
                  <p
                    role="status"
                    className="mt-4 rounded-xl bg-(--primary-soft-hover) p-3 text-sm"
                  >
                    {admissionMessage}
                  </p>
                )}
                <form
                  onSubmit={submitAdmission}
                  className="mt-5 grid gap-4 sm:grid-cols-2"
                >
                  <Field
                    label="Student full name"
                    name="applicantName"
                    placeholder="Student name"
                    required
                  />
                  <Field
                    label="Date of birth"
                    name="dateOfBirth"
                    type="date"
                    required
                  />
                  <label className="block text-sm font-medium">
                    Gender
                    <Select
                      name="gender"
                      className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
                    >
                      <option value="">Prefer not to say</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </Select>
                  </label>
                  <Field
                    label="Class applying for"
                    name="requestedClass"
                    required
                    placeholder="e.g. 1-A or 9-B"
                    list="school-classes"
                  />
                  <datalist id="school-classes">
                    {school.classes?.map((item) => (
                      <option
                        key={item._id}
                        value={`${item.name} - ${item.section}`}
                      />
                    ))}
                  </datalist>
                  <Field
                    label="Parent / guardian name"
                    name="guardianName"
                    placeholder="Gaurdian name"
                    required
                  />
                  <Field
                    label="Guardian phone"
                    name="guardianPhone"
                    placeholder="Gaurdian phone number"
                    type="tel"
                    required
                  />
                  <Field
                    label="Email (optional)"
                    name="email"
                    placeholder="Email address"
                    type="email"
                  />
                  <label className="block text-sm font-medium sm:col-span-2">
                    Address (optional)
                    <Textarea
                      name="address"
                      rows={3}
                      placeholder="Enter full address"
                      className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-(--primary) px-5 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2"
                  >
                    {busy ? "Submitting…" : "Submit application"}
                  </button>
                </form>
              </>
            )}
          </div>
        ) : (
          <div className="mx-auto mt-6 max-w-3xl">
            <h2 className="text-xl font-bold">Student profile and leave</h2>
            <p className="mt-1 text-sm text-(--text-muted)">
              Verify the student using roll/admission number, class and date of
              birth. Leave requests go only to that class&apos;s assigned
              teacher and the school admin.
            </p>
            <form
              onSubmit={lookupStudent}
              className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <Field
                label="Roll / admission number"
                name="rollNumber"
                required
              />
              <label className="block text-sm font-medium">
                Class and section
                <select
                  name="classId"
                  required
                  defaultValue=""
                  className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
                >
                  <option value="" disabled>
                    Select your class
                  </option>
                  {school.classes?.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} · {item.section}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Date of birth"
                name="dateOfBirth"
                type="date"
                required
              />
              <button
                type="submit"
                disabled={busy}
                className="self-end rounded-xl bg-(--primary) px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                <Search size={16} className="mr-2 inline" />
                Find student
              </button>
            </form>
            {lookupMessage && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-700"
              >
                {lookupMessage}
              </p>
            )}
            {student && (
              <article className="mt-5 rounded-2xl border border-(--border) bg-(--primary-soft-hover) p-5">
                <h3 className="text-lg font-bold">{student.name}</h3>
                <p className="mt-1 text-sm text-(--text-muted)">
                  {student.className} · Section {student.section} · Roll{" "}
                  {student.rollNumber || student.admissionNumber}
                </p>
                <h4 className="mt-6 font-semibold">Request leave</h4>
                {leaveMessage && (
                  <p
                    role="status"
                    className="mt-3 rounded-lg bg-(--glass-bg) p-3 text-sm"
                  >
                    {leaveMessage}
                  </p>
                )}
                <form
                  onSubmit={submitLeave}
                  className="mt-4 grid gap-4 sm:grid-cols-2"
                >
                  <Field
                    label="From date"
                    name="fromDate"
                    type="date"
                    required
                  />
                  <Field label="To date" name="toDate" type="date" required />
                  <Field
                    label="Guardian contact phone"
                    name="guardianPhone"
                    type="tel"
                    placeholder="Phone number"
                    required
                  />
                  <label className="block text-sm font-medium sm:col-span-2">
                    Reason for leave
                    <textarea
                      name="reason"
                      required
                      maxLength={1000}
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-(--primary) px-5 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2"
                  >
                    {busy ? "Submitting…" : "Submit leave request"}
                  </button>
                </form>
              </article>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

const ProfileMetric = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl bg-(--primary-soft-hover) bg-linear-125 from-(--card-gradient-1)/50 to-(--card-gradient-2)/10 p-3 text-center">
    <Icon size={17} className="mx-auto text-(--primary)" />
    <p className="mt-1 text-lg font-bold">{value ?? 0}</p>
    <p className="text-xs text-(--text-muted)">{label}</p>
  </div>
);

const Detail = ({ label, value }) => (
  <div className="flex gap-2">
    <dt className="w-32 shrink-0 text-(--text-muted)">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);

const Field = ({
  label,
  name,
  type = "text",
  required = false,
  list,
  placeholder,
}) => (
  <label className="block text-sm font-medium">
    {label}
    <Input
      name={name}
      type={type}
      required={required}
      placeholder={placeholder}
      list={list}
      className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
    />
  </label>
);

export default PublicSchoolProfile;
