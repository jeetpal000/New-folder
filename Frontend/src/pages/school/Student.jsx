import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserGroup,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import FloatingParticles from "../../components/FloatingParticles/FloatingPartcles";
import { Input, Select, Textarea } from "../../components/UI";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/date";

const Students = () => {
  useEffect(() => {
    document.title = "NexaManage | Students";
  }, []);

  const user = useAuthStore((state) => state.user);
  const isAdmin = (user?.roleId?.role || user?.roleId?.name) === "Admin";
  const canViewStudents =
    isAdmin || user?.permissions?.includes("student.view");
  const canCreateStudent =
    isAdmin || user?.permissions?.includes("student.create");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [studentClass, setStudentClass] = useState("All");
  const [showAddStudent, setShowAddStudent] = useState(false);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadStudents = useCallback(async () => {
    if (!canViewStudents) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/students");
      setStudents(
        (response.data.students || []).map((student) => ({
          id: student._id,
          name: student.name,
          email: student.email || "",
          phone: student.phone || "",
          class: student.classId?.name || "",
          section: student.classId?.section || "",
          rollNo: student.rollNumber || student.admissionNumber || "—",
          gender: student.gender || "",
          status: student.isActive ? "Active" : "Inactive",
          photo: student.photo?.url || "",
          admissionDate: formatDate(student.createdAt),
          createdAt: student.createdAt,
        })),
      );
      setLoadError("");
    } catch (error) {
      setLoadError(error.response?.data?.message || "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, [canViewStudents]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const classes = [...new Set(students.map((student) => student.class))].sort(
    (a, b) => Number(a) - Number(b),
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        student.name.toLowerCase().includes(searchValue) ||
        student.email.toLowerCase().includes(searchValue) ||
        student.phone.includes(searchValue) ||
        student.id.toLowerCase().includes(searchValue);

      const matchesStatus = status === "All" || student.status === status;

      const matchesClass =
        studentClass === "All" || student.class === studentClass;

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [students, search, status, studentClass]);

  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student.status === "Active",
  ).length;

  const inactiveStudents = students.filter(
    (student) => student.status === "Inactive",
  ).length;

  const now = new Date();
  const newStudents = students.filter((student) => {
    const createdAt = new Date(student.createdAt);
    return (
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    );
  }).length;

  if (!canViewStudents) {
    return (
      <main className="relative min-h-[60vh] space-y-5 p-6">
        <h1 className="text-2xl font-bold">Add a student</h1>
        <p className="text-sm text-(--text-muted)">
          You have permission to add students. Student records are not visible
          with your current access.
        </p>
        {canCreateStudent && (
          <button
            type="button"
            onClick={() => setShowAddStudent(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={18} />
            Add Student
          </button>
        )}
        {showAddStudent && (
          <AddStudentModal
            onClose={() => setShowAddStudent(false)}
            onCreated={loadStudents}
          />
        )}
      </main>
    );
  }

  return (
    <div className="relative w-full space-y-5 pb-8">
      <FloatingParticles />

      <div>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between  border-b border-(--border) pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <UserGroup size={21} className="text-(--primary)" />
                Students
              </h1>

              <span className="rounded-full bg-(--primary-soft) px-2.5 py-1 text-xs font-semibold text-(--primary)">
                {totalStudents}
              </span>
            </div>

            <p className="mt-1 text-sm text-(--text-muted)">
              Manage students, admissions and academic information.
            </p>
          </div>

          {canCreateStudent && (
            <button
              onClick={() => setShowAddStudent(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              Add Student
            </button>
          )}
        </div>

        {loadError && (
          <p
            role="alert"
            className="my-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-600"
          >
            {loadError}
          </p>
        )}
        {loading && (
          <p className="my-4 text-sm text-(--text-muted)">Loading students…</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 my-4">
          <StudentStat
            title="Total Students"
            value={totalStudents}
            icon={Users}
          />

          <StudentStat
            title="Active Students"
            value={activeStudents}
            icon={UserCheck}
          />

          <StudentStat
            title="Inactive Students"
            value={inactiveStudents}
            icon={UserCheck}
          />

          <StudentStat
            title="New This Month"
            value={newStudents}
            icon={UserPlus}
          />
        </div>

        {/* Search + Filters */}
        <div className="rounded-2xl border border-(--border) bg-(--primary-soft-hover) p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-foreground)]"
              />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, student ID, email or phone..."
                className="w-full rounded-md border border-(--border) bg-(--primary-soft) py-2.5 pl-10 pr-4 text-sm text-(--foreground) outline-none transition  focus:border-(--input-border)"
              />
            </div>

            {/* Class */}
            <div className="relative min-w-[160px]">
              <Filter
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-foreground)]"
              />

              <Select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className=" rounded-xl border border-(--border) bg-(--primary-soft) py-2.5 pl-10 pr-8 text-sm text-(--foreground) outline-none focus:border-(--primary)]"
              >
                <option value="All">All Classes</option>

                {classes.map((item) => (
                  <option key={item} value={item}>
                    Class {item}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status */}
            <div className="">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className=" rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm text-(--foreground) outline-none focus:border-(--primary)]"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-hidden rounded-2xl border border-(--border) bg-(--glass-bg) my-4 shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-(--border) bg-(--background)]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-(--text)">
                    Student
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-(--text)">
                    Class
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-(--text)">
                    Roll No.
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-(--text)">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-(--text)">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-(--text)">
                    Admission
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide  text-(--text)">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="perspective-dramatic">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <StudentRow key={student.id} student={student} />
                  ))
                ) : loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-14 text-center text-sm text-(--text-muted)"
                    >
                      Loading student records…
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center">
                        <Users size={38} className="text-(--text-muted)" />

                        <p className="mt-3 font-medium text-(--text)">
                          No students found
                        </p>

                        <p className="mt-1 text-sm text-(--text-muted)">
                          Try changing your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination count={filteredStudents.length} />
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 lg:hidden mt-5">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <StudentMobileCard key={student.id} student={student} />
            ))
          ) : loading ? (
            <p className="py-8 text-center text-sm text-(--text-muted)">
              Loading student records…
            </p>
          ) : (
            <div className="rounded-2xl border border-(--border) bg-(--card) px-5 py-12 text-center">
              <Users size={38} className="mx-auto text-(--muted-foreground)]" />

              <p className="mt-3 font-medium text-(--foreground)]">
                No students found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onCreated={loadStudents}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Stats                                                                       */
/* -------------------------------------------------------------------------- */

const StudentStat = ({ title, value, icon: Icon }) => {
  return (
    <div className="rounded-2xl border border-(--border) bg-linear-45 backdrop-blur-sm from-(--card-gradient-1) to-(--card-gradient-2)/10 p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-(--text-muted) sm:text-sm">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-(--foreground) sm:text-3xl">
            {value}
          </p>
        </div>

        <div className="rounded-xl text-(--primary)">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Desktop Row                                                                 */
/* -------------------------------------------------------------------------- */

const StudentRow = ({ student }) => {
  const navigate = useNavigate();
  return (
    <tr
      className="border-b border-(--border) last:border-0 hover:bg-(--glass-bg-hover)  hover:shadow(--shadow-xl) transition-all duration-100"
      onClick={() => navigate(`/students/details/${student.id}`)}
    >
      {/* Student */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} photo={student.photo} />

          <div>
            <p className="font-semibold text-(--text)">{student.name}</p>

            <p className="text-xs text-(--text-muted)">{student.id}</p>
          </div>
        </div>
      </td>

      {/* Class */}
      <td className="px-5 py-4">
        <div>
          <p className="font-medium text-(--text)">Class {student.class}</p>

          <p className="text-xs text-(--text-muted)">
            Section {student.section}
          </p>
        </div>
      </td>

      {/* Roll */}
      <td className="px-5 py-4 text-sm text-(--text)">{student.rollNo}</td>

      {/* Contact */}
      <td className="px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-(--text)">
            <Phone size={13} />
            {student.phone}
          </div>

          <div className="flex items-center gap-2 text-xs text-(--text)">
            <Mail size={13} />
            {student.email}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <StatusBadge status={student.status} />
      </td>

      {/* Admission */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-(--text-muted)">
          <CalendarDays size={15} />
          {student.admissionDate}
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <ActionButton icon={Eye} title="View" />
          <ActionButton icon={Edit3} title="Edit" />
          <ActionButton icon={Trash2} title="Delete" danger />
        </div>
      </td>
    </tr>
  );
};

/* -------------------------------------------------------------------------- */
/* Mobile Card                                                                 */
/* -------------------------------------------------------------------------- */

const StudentMobileCard = ({ student }) => {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-2xl border border-(--border) bg-(--primary-soft) hover:(--primary-soft-hover) p-4 shadow-sm"
      onClick={() => navigate(`/students/details/${student.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} photo={student.photo} />

          <div>
            <p className="font-semibold text-(--foreground)">{student.name}</p>

            {/* <p className="text-xs text-(--muted-foreground)]">{student.id}</p> */}
          </div>
        </div>

        <StatusBadge status={student.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <InfoItem
          label="Class"
          value={`${student.class} - ${student.section}`}
        />

        <InfoItem label="Roll No." value={student.rollNo} />

        <InfoItem label="Phone" value={student.phone} />

        <InfoItem label="Admission" value={student.admissionDate} />
      </div>

      {/* <div className="mt-4 flex items-center justify-between border-t border-(--border) pt-3">
        <div className="flex gap-1">
          <ActionButton icon={Eye} title="View" />
          <ActionButton icon={Edit3} title="Edit" />
        </div>
      </div> */}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Add Student Modal                                                           */
/* -------------------------------------------------------------------------- */

const AddStudentModal = ({ onClose, onCreated }) => {
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    classId: "",
    rollNumber: "",
    admissionNumber: "",
    dateOfBirth: "",
    gender: "Male",
    phone: "",
    email: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    photo: null,
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api
      .get("/get-classes")
      .then((response) => setClasses(response.data.classes || []))
      .catch((error) =>
        setErrorMessage(
          error.response?.data?.message || "Could not load classes.",
        ),
      );
  }, []);

  const updateField = (field) => (event) =>
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  const submitStudent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") payload.append(key, value);
      });
      await api.post("/students", payload);
      await onCreated();
      onClose();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not create student.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={submitStudent}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-none rounded-2xl border border-(--border) bg-linear-125 from-(--card-gradient-1) to-(--card-gradient-2) shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border) bg-(--glass-bg-hover) px-5 py-4 backdrop-blur-2xl sm:px-6">
          <div>
            <h2 className="text-lg font-bold">Add Student</h2>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Add a student to a class in this school.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-(--text-muted) hover:bg-(--background)"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600"
            >
              {errorMessage}
            </p>
          )}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Personal Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full Name"
                required
                value={formData.name}
                onChange={updateField("name")}
                placeholder="Enter student name"
              />
              <FormField
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={updateField("dateOfBirth")}
              />
              <FormField
                label="Phone"
                value={formData.phone}
                type="phone"
                onChange={updateField("phone")}
                placeholder="Enter mobile number"
              />
              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={updateField("email")}
                placeholder="student@example.com"
              />
              <label className="block text-sm font-medium">
                Gender
                <Select
                  value={formData.gender}
                  onChange={updateField("gender")}
                  className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm text-(--text)"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </Select>
              </label>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Academic Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Class
                <Select
                  required
                  value={formData.classId}
                  onChange={updateField("classId")}
                  className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm text-(--text)"
                >
                  <option value="">Select a class</option>
                  {classes.map((schoolClass) => (
                    <option key={schoolClass._id} value={schoolClass._id}>
                      {schoolClass.name} - {schoolClass.section}
                    </option>
                  ))}
                </Select>
              </label>
              <FormField
                label="Roll Number"
                value={formData.rollNumber}
                onChange={updateField("rollNumber")}
              />
              <FormField
                label="Admission Number"
                required
                value={formData.admissionNumber}
                onChange={updateField("admissionNumber")}
              />
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Parent / Guardian</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Guardian Name"
                value={formData.guardianName}
                onChange={updateField("guardianName")}
              />
              <FormField
                label="Guardian Phone"
                value={formData.guardianPhone}
                onChange={updateField("guardianPhone")}
              />
            </div>
          </div>
          <label className="block text-sm font-medium">
            Address
            <Textarea
              rows={3}
              value={formData.address}
              onChange={updateField("address")}
              className="mt-1.5 w-full resize-none rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm text-(--text)"
            />
          </label>
          <label className="block text-sm font-medium">
            Student Photo
            <Input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  photo: event.target.files?.[0] || null,
                }))
              }
            />
          </label>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-(--border) bg-(--glass-bg-hover) px-5 py-4 backdrop-blur-2xl sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-(--border) px-4 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || classes.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-(--primary) px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus size={17} />
            {saving ? "Saving…" : "Add Student"}
          </button>
        </div>
      </form>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const Avatar = ({ name, photo }) => {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--primary-soft) text-sm font-bold text-(--primary)">
      {photo ? (
        <img
          src={photo}
          alt={`${name} photo`}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-red-500/10 text-red-600"
      }`}
    >
      {status}
    </span>
  );
};

const ActionButton = ({ icon: Icon, title, danger = false }) => {
  return (
    <button
      title={title}
      className={`rounded-lg p-2 transition ${
        danger
          ? "text-red-500 hover:bg-red-500/10"
          : "text-(--text) hover:bg-(--primary-soft) hover:text-(--foreground)]"
      }`}
    >
      <Icon size={16} />
    </button>
  );
};

const InfoItem = ({ label, value }) => {
  return (
    <div>
      <p className="text-xs text-(--muted-foreground)]">{label}</p>

      <p className="mt-0.5 truncate text-sm font-medium text-(--foreground)]">
        {value}
      </p>
    </div>
  );
};

const FormField = ({
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  required = false,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-(--text)">
        {label}
      </label>

      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-md border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm text-(--text) outline-none placeholder:text-(--text-muted) focus:border-(--primary)"
      />
    </div>
  );
};

const Pagination = ({ count }) => {
  return (
    <div className="flex items-center justify-between border-t border-(--border) px-5 py-4">
      <p className="text-sm text-(--muted-foreground)]">
        Showing{" "}
        <span className="font-medium text-(--foreground)]">{count}</span>{" "}
        students
      </p>

      <div className="flex items-center gap-1">
        <button className="rounded-lg border border-(--border) p-2 text-(--muted-foreground) hover:bg-(--background)]">
          <ChevronLeft size={16} />
        </button>

        <button className="rounded-lg bg-(--primary) px-3 py-1.5 text-sm font-medium text-white">
          1
        </button>

        <button className="rounded-lg border border-(--border) px-3 py-1.5 text-sm text-(--foreground) hover:bg-(--background)]">
          2
        </button>

        <button className="rounded-lg border border-(--border) p-2 text-(--muted-foreground) hover:bg-(--background)]">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Students;
