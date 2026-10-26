import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeIndianRupee,
  BookOpen,
  CalendarDays,
  Check,
  Download,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  Printer,
  School,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const blankProfile = {
  name: "",
  email: "",
  phone: "",
  employeeId: "",
  dateOfBirth: "",
  gender: "",
  designation: "",
  role: "",
  joiningDate: "",
  experience: "",
  qualification: "",
  address: "",
  isActive: true,
};

const formatDate = (value, fallback = "Not provided") => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const dateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const periodLabel = (period) => {
  const [year, month] = period.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const roleLabel = (role) => role?.role || role?.name || "Teacher";

function SummaryCard({ title, value, hint, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span className={`rounded-xl p-3 ${color}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

function Detail({ label, value, icon: Icon }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
      {Icon && <Icon size={17} className="mt-0.5 shrink-0 text-slate-400" />}
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-800">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function TeacherAvatar({ name, photo, size = "large" }) {
  const sizeClass =
    size === "large" ? "h-24 w-24 text-3xl" : "h-11 w-11 text-base";
  return photo ? (
    <img
      src={photo}
      alt={`${name || "Teacher"} profile`}
      className={`${sizeClass} rounded-sm object-cover shadow-lg`}
    />
  ) : (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 font-bold text-indigo-700 shadow-lg`}
      aria-label={`${name || "Teacher"} profile`}
    >
      {(name || "T")
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}

export default function TeacherDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roleId?.role === "Admin";
  const canUpdate = isAdmin || user?.permissions?.includes("teacher.update");
  const [teacher, setTeacher] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(blankProfile);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [payoutForm, setPayoutForm] = useState({
    period: new Date().toISOString().slice(0, 7),
    amount: "",
    note: "",
  });
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  const loadTeacher = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get(`/teachers/${id}`);
      if (!data.success || !data.teacher) {
        throw new Error("Teacher details could not be loaded.");
      }
      setTeacher(data.teacher);
      setPayouts(data.payouts || []);
      setRoles(data.roles || []);
    } catch (loadError) {
      setError(
        loadError.response?.data?.message ||
          loadError.message ||
          "Could not load teacher details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTeacher();
  }, [loadTeacher]);

  useEffect(() => {
    document.title = teacher
      ? `NexaManage | ${teacher.userId?.name || "Teacher"}`
      : "NexaManage | Teacher details";
  }, [teacher]);

  useEffect(() => {
    if (!profilePhoto) {
      setPhotoPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(profilePhoto);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [profilePhoto]);

  const startEditing = async () => {
    if (!teacher) return;
    setError("");
    setSuccessMessage("");
    setProfile({
      name: teacher.userId?.name || "",
      email: teacher.userId?.email || "",
      phone: teacher.userId?.phone || "",
      employeeId: teacher.employeeId || "",
      dateOfBirth: dateForInput(teacher.dateOfBirth),
      gender: teacher.gender || "",
      designation: teacher.designation || "Teacher",
      role: roleLabel(teacher.userId?.roleId),
      joiningDate: dateForInput(teacher.joiningDate),
      experience: teacher.experience || "",
      qualification: (teacher.qualification || []).join(", "),
      address: teacher.address?.street || "",
      isActive: Boolean(teacher.isActive),
    });
    setAssignments(
      (teacher.teachingAssignments || [])
        .filter((item) => item.classId?._id)
        .map((item) => ({
          classId: item.classId._id,
          className:
            `${item.classId.name} - ${item.classId.section || ""}`.trim(),
          subjectIds: (item.subjectIds || []).map((subject) => subject._id),
          subjectNames: (item.subjectIds || []).map((subject) => subject.name),
        })),
    );
    setProfilePhoto(null);
    setEditing(true);
    try {
      const response = await api.get("/get-classes");
      setClasses(response.data.classes || []);
    } catch (loadError) {
      setError(
        loadError.response?.data?.message ||
          "Could not load classes for editing.",
      );
    }
  };

  useEffect(() => {
    let active = true;
    const loadSubjects = async () => {
      setAvailableSubjects([]);
      setSelectedSubjectIds([]);
      if (!selectedClassId) return;
      try {
        const { data } = await api.get("/get-subject", {
          params: { classId: selectedClassId },
        });
        if (active) setAvailableSubjects(data.getSubject || []);
      } catch (loadError) {
        if (active) {
          setError(
            loadError.response?.data?.message ||
              "Could not load subjects for this class.",
          );
        }
      }
    };
    loadSubjects();
    return () => {
      active = false;
    };
  }, [selectedClassId]);

  const updateProfileField = (field) => (event) => {
    const value =
      field === "isActive" ? event.target.checked : event.target.value;
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const addAssignment = () => {
    if (!selectedClassId || selectedSubjectIds.length === 0) {
      setError("Select a class and at least one subject.");
      return;
    }
    const classRecord = classes.find((item) => item._id === selectedClassId);
    setAssignments((current) => [
      ...current.filter((item) => item.classId !== selectedClassId),
      {
        classId: selectedClassId,
        className:
          `${classRecord?.name || "Class"} - ${classRecord?.section || ""}`.trim(),
        subjectIds: selectedSubjectIds,
        subjectNames: availableSubjects
          .filter((subject) => selectedSubjectIds.includes(subject._id))
          .map((subject) => subject.name),
      },
    ]);
    setSelectedClassId("");
    setAvailableSubjects([]);
    setSelectedSubjectIds([]);
    setError("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = new FormData();
      Object.entries(profile).forEach(([field, value]) => {
        payload.append(field, String(value));
      });
      payload.append("assignments", JSON.stringify(assignments));
      if (profilePhoto) payload.append("photo", profilePhoto);
      const { data } = await api.put(`/teachers/${id}`, payload);
      setTeacher(data.teacher);
      setEditing(false);
      setProfilePhoto(null);
      setSuccessMessage("Teacher details saved.");
    } catch (saveError) {
      setError(
        saveError.response?.data?.message || "Could not save teacher details.",
      );
    } finally {
      setSaving(false);
    }
  };

  const createPayout = async (event) => {
    event.preventDefault();
    setSavingPayout(true);
    setError("");
    setSuccessMessage("");
    try {
      const { data } = await api.post(`/teachers/${id}/payouts`, {
        period: payoutForm.period,
        amount: Number(payoutForm.amount),
        note: payoutForm.note,
      });
      setPayouts((current) =>
        [data.payout, ...current].sort((left, right) =>
          right.period.localeCompare(left.period),
        ),
      );
      setPayoutForm({
        period: new Date().toISOString().slice(0, 7),
        amount: "",
        note: "",
      });
      setShowPayoutForm(false);
      setSuccessMessage("Payout added to the pending ledger.");
    } catch (payoutError) {
      setError(
        payoutError.response?.data?.message || "Could not record this payout.",
      );
    } finally {
      setSavingPayout(false);
    }
  };

  const setPayoutStatus = async (payout, status) => {
    setError("");
    setSuccessMessage("");
    try {
      const { data } = await api.patch(
        `/teachers/${id}/payouts/${payout._id}`,
        { status },
      );
      setPayouts((current) =>
        current.map((item) => (item._id === payout._id ? data.payout : item)),
      );
    } catch (payoutError) {
      setError(
        payoutError.response?.data?.message ||
          "Could not update payout status.",
      );
    }
  };

  const paidPayouts = useMemo(
    () => payouts.filter((payout) => payout.status === "Paid"),
    [payouts],
  );
  const pendingPayouts = useMemo(
    () => payouts.filter((payout) => payout.status === "Pending"),
    [payouts],
  );
  const paidTotal = paidPayouts.reduce(
    (total, payout) => total + Number(payout.amount || 0),
    0,
  );
  const pendingTotal = pendingPayouts.reduce(
    (total, payout) => total + Number(payout.amount || 0),
    0,
  );

  const printIdCard = () => window.print();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="animate-pulse rounded-2xl bg-slate-100 p-10 text-slate-500">
          Loading teacher profile...
        </div>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 p-6">
        <button
          type="button"
          onClick={() => navigate("/teachers")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"
        >
          <ArrowLeft size={17} /> Back to teachers
        </button>
        <div role="alert" className="rounded-2xl bg-red-50 p-5 text-red-700">
          {error || "Teacher profile could not be found."}
        </div>
      </main>
    );
  }

  const teacherName = teacher.userId?.name || "Teacher";
  const schoolName = teacher.schoolId?.schoolName || "School";
  const cardRole = teacher.designation || roleLabel(teacher.userId?.roleId);

  return (
    <main className="mx-auto max-w-6xl space-y-6 sm:px-4 py-6 px-2">
      <style>{`
        @media print {
          @page { size: 90mm 58mm; margin: 0; }
          body * { visibility: hidden !important; }
          #teacher-id-card, #teacher-id-card * { visibility: visible !important; }
          #teacher-id-card {
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: 107.5mm !important;
            height: 67.5mm !important;
            margin: 0 !important;
            transform: scale(.8) !important;
            transform-origin: top left !important;
            box-shadow: none !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/teachers")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={17} /> Teachers
        </button>
        <div className="flex flex-wrap gap-2">
          {canUpdate && !editing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} /> Edit details
            </button>
          )}
          <button
            type="button"
            onClick={printIdCard}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Download size={16} /> Download ID card
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {successMessage && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {successMessage}
        </p>
      )}

      {/* <section className=" relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-(--primary)/50 via-(--card-gradient-1) to-(--primary)/50 shadow-sm  flex justify-between items-center"> */}
      {/* <div className="h-36"> */}
      {/* <div className="">
          <TeacherAvatar
            name={teacherName}
            photo={
              // teacher.profileImage ||
              "https://res.cloudinary.com/df5fycocb/image/upload/v1792678256/students/6abd4469744359448f9eb176/wkpe01npcxveqggy7xjv.jpg"
            }
          />
        </div>

        <div className="flex items-center gap-4 px-6 ">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {" "}
              {teacherName.split(" ")[0].slice(0, 1).toUpperCase() +
                teacherName
                  .split(" ")[0]
                  .slice(1, teacherName.split("").length)}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {teacher.designation || "Teacher"} · Employee ID{" "}
              {teacher.employeeId || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
              Role: {roleLabel(teacher.userId?.roleId)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              Joined {formatDate(teacher.joiningDate)}
            </span>
          </div>
        </div> */}
      {/* </section> */}

      <section className="rounded-3xl border border-slate-200  p-2 sm:p-6 grid lg:grid-cols-2 grid-cols-1">
        <div className="">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                Teacher identification card
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Print directly or save as PDF from the print dialog.
              </p>
            </div>
            <ShieldCheck size={21} className="text-indigo-600" />
          </div>

          <article
            id="teacher-id-card"
            className="relative mx-auto flex min-h-120 min-w-85 max-w-85 w-85 flex-col overflow-hidden rounded-2xl border border-slate-200  text-slate-800 shadow-2xl bg-(--primary-soft-hover)"
          >
            {/* Top Header */}
            <header className="relative overflow-hidden bg-linear-to-br from-indigo-950 via-indigo-800 to-blue-700 px-5 pb-16 pt-5 text-white">
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/5" />
              <div className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-sky-400/50 blur-xl" />

              <div className="relative flex items-center gap-3">
                {
                  // teacher.schoolId?.logo
                  true ? (
                    <img
                      src={
                        // teacher.schoolId.logo ||
                        "https://res.cloudinary.com/df5fycocb/image/upload/v1792678256/students/6abd4469744359448f9eb176/wkpe01npcxveqggy7xjv.jpg"
                      }
                      alt="School logo"
                      crossOrigin="anonymous"
                      className="h-12 w-12 shrink-0 rounded-xl  shadow-md"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                      <School size={26} />
                    </div>
                  )
                }

                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-sm font-extrabold uppercase leading-snug tracking-wide">
                    {schoolName}
                  </h2>
                  <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-sky-200">
                    Faculty Identity Card
                  </p>
                </div>
              </div>

              <div className="relative mt-5 flex justify-center">
                <span className="rounded-full border border-white/25 bg-white/10 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] backdrop-blur-sm">
                  Teaching Staff
                </span>
              </div>
            </header>

            {/* Teacher Photo */}
            <div className="relative z-10 -mt-12 flex flex-col items-center px-5">
              <div className="rounded-md">
                <div className="rounded-sm p-0.4 ring-1 ring-(--primary)">
                  <TeacherAvatar
                    name={teacherName}
                    photo={
                      teacher.profileImage ||
                      "https://res.cloudinary.com/df5fycocb/image/upload/v1792678256/students/6abd4469744359448f9eb176/wkpe01npcxveqggy7xjv.jpg"
                    }
                    size="large"
                  />
                </div>
              </div>

              <h3 className="mt-1 max-w-full text-center text-xl font-extrabold tracking-tight text-slate-900">
                {teacherName.split(" ")[0].slice(0, 1).toUpperCase() +
                  teacherName
                    .split(" ")[0]
                    .slice(1, teacherName.split("").length)}
              </h3>

              <p className="mt-1 rounded-full bg-indigo-50 px-4 py-1 text-xs font-bold text-indigo-700">
                {cardRole}
              </p>
            </div>

            {/* Teacher Details */}
            <div className="flex-1 px-5 pt-2">
              <div className="space-y-3.5">
                {/* Employee ID */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-2 py-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                    Employee ID
                  </p>
                  <p className="break-all font-mono text-base font-extrabold tracking-wider text-indigo-950">
                    {teacher.employeeId || "Not assigned"}
                  </p>
                </div>

                {/* DOB */}
                <div className="grid grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg  text-slate-600">
                      <CalendarDays size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                        Date of Birth
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-slate-700">
                        {formatDate(teacher.dateOfBirth, "Not recorded")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600">
                      <PhoneCall size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                        Phone Number
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-slate-700">
                        {teacher.userId?.phone || "Not recorded"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* School Address */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg  text-slate-600">
                    <MapPin size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                      School Address
                    </p>
                    <p className="mt-0.5 wrap-break text-xs font-medium leading-relaxed text-slate-700">
                      {teacher.schoolId?.address || "Address not available"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    {/* <div className="mb-1.5 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-sky-400" /> */}
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-950">
                      Authorized Staff
                    </p>
                    <p className="mt-1 text-[9px] text-slate-500">
                      Valid for school identification
                    </p>
                  </div>

                  <div className="shrink-0 text-center">
                    <div className="mb-1 flex h-8 w-24 items-end justify-center border-b border-slate-400">
                      <span className="font-serif text-xs italic text-slate-500">
                        Signature
                      </span>
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                      Principal / Admin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="h-2 shrink-0 bg-linear-to-r from-indigo-950 via-indigo-600 to-sky-500" />
          </article>
        </div>

        <section className="lg:border-l border-(--border) lg:pl-5 lg:mt-15 mt-5">
          {/* <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                Teacher Details
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Print directly or save as PDF from the print dialog.
              </p>
            </div>
            <ShieldCheck size={21} className="text-indigo-600" />
          </div> */}
          <div className="mb-3 flex items-center gap-2">
            <UserRound size={19} className="text-indigo-600" />
            <h2 className="font-bold text-slate-900">
              Personal and employment details
            </h2>
          </div>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <Detail label="Email" value={teacher.userId?.email} icon={Mail} />
            <Detail label="Phone" value={teacher.userId?.phone} icon={Phone} />
            <Detail
              label="Date of birth"
              value={formatDate(teacher.dateOfBirth)}
              icon={CalendarDays}
            />
            <Detail label="Gender" value={teacher.gender} icon={UserRound} />
            <Detail
              label="Joining date"
              value={formatDate(teacher.joiningDate)}
              icon={CalendarDays}
            />
            <Detail
              label="Experience"
              value={
                teacher.experience
                  ? `${teacher.experience} years`
                  : "Not provided"
              }
              icon={GraduationCap}
            />
            <Detail
              label="Qualifications"
              value={(teacher.qualification || []).join(", ")}
              icon={GraduationCap}
            />
            <Detail
              label="Address"
              value={teacher.address?.street}
              icon={MapPin}
            />
          </div>
        </section>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={19} className="text-indigo-600" />
          <h2 className="font-bold text-slate-900">Teaching assignments</h2>
        </div>
        <div className="space-y-3">
          {(teacher.teachingAssignments || []).length ? (
            teacher.teachingAssignments.map((assignment) => (
              <div
                key={assignment._id || assignment.classId?._id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-800">
                  {assignment.classId?.name || "Class"}{" "}
                  {assignment.classId?.section
                    ? `· ${assignment.classId.section}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(assignment.subjectIds || []).map((subject) => (
                    <span
                      key={subject._id}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100"
                    >
                      {subject.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No classes or subjects assigned yet.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Paid payouts"
          value={paidPayouts.length}
          hint={formatCurrency(paidTotal)}
          icon={Wallet}
          color="bg-emerald-50 text-emerald-700"
        />
        <SummaryCard
          title="Pending payouts"
          value={pendingPayouts.length}
          hint={formatCurrency(pendingTotal)}
          icon={BadgeIndianRupee}
          color="bg-amber-50 text-amber-700"
        />
        <SummaryCard
          title="Assigned classes"
          value={(teacher.teachingAssignments || []).length}
          hint="Current teaching assignments"
          icon={School}
          color="bg-sky-50 text-sky-700"
        />
        <SummaryCard
          title="Assigned subjects"
          value={
            new Set(
              (teacher.teachingAssignments || []).flatMap((item) =>
                (item.subjectIds || []).map((subject) => subject._id),
              ),
            ).size
          }
          hint="Across all assigned classes"
          icon={BookOpen}
          color="bg-violet-50 text-violet-700"
        />
      </section>

      {editing && (
        <section className="rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Edit teacher details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update their profile, role, designation, and teaching
                assignments.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close edit form"
              onClick={() => setEditing(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={19} />
            </button>
          </div>
          <form onSubmit={saveProfile} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["name", "Full name", "text"],
                ["email", "Email address", "email"],
                ["phone", "Phone number", "tel"],
                ["employeeId", "Teacher ID", "text"],
                ["designation", "Designation", "text"],
                ["experience", "Experience (years)", "number"],
              ].map(([field, label, type]) => (
                <label
                  key={field}
                  className="block text-sm font-medium text-slate-700"
                >
                  {label}
                  <input
                    required={[
                      "name",
                      "email",
                      "phone",
                      "employeeId",
                      "designation",
                    ].includes(field)}
                    min={type === "number" ? "0" : undefined}
                    type={type}
                    value={profile[field]}
                    onChange={updateProfileField(field)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              ))}
              <label className="block text-sm font-medium text-slate-700">
                Role
                <select
                  value={profile.role}
                  onChange={updateProfileField("role")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  {[...new Set([profile.role, ...roles])]
                    .filter(Boolean)
                    .filter((role) => isAdmin || role.toLowerCase() !== "admin")
                    .map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Gender
                <select
                  value={profile.gender}
                  onChange={updateProfileField("gender")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Date of birth
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={updateProfileField("dateOfBirth")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Joining date
                <input
                  type="date"
                  value={profile.joiningDate}
                  onChange={updateProfileField("joiningDate")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Qualifications (comma separated)
                <input
                  value={profile.qualification}
                  onChange={updateProfileField("qualification")}
                  placeholder="B.Ed, M.Sc"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Address
                <input
                  value={profile.address}
                  onChange={updateProfileField("address")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Profile picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setProfilePhoto(event.target.files?.[0] || null)
                  }
                  className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-medium file:text-indigo-700"
                />
              </label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="New teacher profile preview"
                  className="h-16 w-16 rounded-xl object-cover"
                />
              )}
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={profile.isActive}
                onChange={updateProfileField("isActive")}
                className="h-4 w-4 accent-indigo-600"
              />
              Teacher is active
            </label>

            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Classes and subjects
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Add, change, or remove assignments. Assignments require at
                  least one subject.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  <option value="">Choose a class</option>
                  {classes.map((record) => (
                    <option key={record._id} value={record._id}>
                      {record.name} - {record.section}{" "}
                      {record.course ? `(${record.course})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addAssignment}
                  disabled={!selectedClassId || !selectedSubjectIds.length}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 disabled:opacity-40"
                >
                  <Plus size={16} /> Add assignment
                </button>
              </div>
              {selectedClassId && (
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.length ? (
                    availableSubjects.map((subject) => (
                      <label
                        key={subject._id}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjectIds.includes(subject._id)}
                          onChange={() =>
                            setSelectedSubjectIds((current) =>
                              current.includes(subject._id)
                                ? current.filter(
                                    (value) => value !== subject._id,
                                  )
                                : [...current, subject._id],
                            )
                          }
                          className="accent-indigo-600"
                        />
                        {subject.name}
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No subjects are configured for this class.
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.classId}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                  >
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">
                        {assignment.className}
                      </span>
                      <span className="ml-2 text-slate-500">
                        {assignment.subjectNames.join(", ")}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setAssignments((current) =>
                          current.filter(
                            (item) => item.classId !== assignment.classId,
                          ),
                        )
                      }
                      aria-label={`Remove ${assignment.className} assignment`}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {!assignments.length && (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    No class assignments saved. Add a class and subject before
                    saving.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || assignments.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Check size={16} /> {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wallet size={19} className="text-indigo-600" />
              <h2 className="font-bold text-slate-900">Payout ledger</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Record payments manually; pending and paid totals reflect the
              entries below.
            </p>
          </div>
          {canUpdate && (
            <button
              type="button"
              onClick={() => setShowPayoutForm((shown) => !shown)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              {showPayoutForm ? <X size={16} /> : <Plus size={16} />}
              {showPayoutForm ? "Cancel" : "Add payout"}
            </button>
          )}
        </div>
        {showPayoutForm && (
          <form
            onSubmit={createPayout}
            className="mb-5 grid gap-3 rounded-2xl bg-indigo-50/70 p-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end"
          >
            <label className="text-sm font-medium text-slate-700">
              Payout month
              <input
                required
                type="month"
                value={payoutForm.period}
                onChange={(event) =>
                  setPayoutForm((current) => ({
                    ...current,
                    period: event.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Amount (₹)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={payoutForm.amount}
                onChange={(event) =>
                  setPayoutForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Note
              <input
                value={payoutForm.note}
                onChange={(event) =>
                  setPayoutForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Optional"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              />
            </label>
            <button
              type="submit"
              disabled={savingPayout}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingPayout ? "Saving..." : "Record pending"}
            </button>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3 font-semibold">Month</th>
                <th className="px-3 py-3 font-semibold">Amount</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Note / paid date</th>
                {canUpdate && (
                  <th className="px-3 py-3 text-right font-semibold">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr
                  key={payout._id}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="px-3 py-3 text-sm font-medium text-slate-800">
                    {periodLabel(payout.period)}
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                    {formatCurrency(payout.amount)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payout.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500">
                    {payout.note ||
                      (payout.paidAt
                        ? `Paid ${formatDate(payout.paidAt)}`
                        : "—")}
                  </td>
                  {canUpdate && (
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setPayoutStatus(
                            payout,
                            payout.status === "Paid" ? "Pending" : "Paid",
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Mark {payout.status === "Paid" ? "pending" : "paid"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!payouts.length && (
                <tr>
                  <td
                    colSpan={canUpdate ? 5 : 4}
                    className="px-3 py-10 text-center text-sm text-slate-500"
                  >
                    No payout entries have been recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
