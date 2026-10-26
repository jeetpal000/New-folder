import { useCallback, useEffect, useMemo, useState } from "react";

import FloatingParticles from "../../components/FloatingParticles/FloatingPartcles";

import {
  BookOpen,
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
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Input, Label, Select } from "../../components/UI";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const Teachers = () => {
  useEffect(() => {
    document.title = "NexaManage | Teachers";
  }, []);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [subject, setSubject] = useState("All");
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roleId?.role === "Admin";
  const canViewTeachers =
    isAdmin || user?.permissions?.includes("teacher.view");
  const canCreateTeacher =
    isAdmin || user?.permissions?.includes("teacher.create");

  const loadTeachers = useCallback(async () => {
    if (!canViewTeachers) return;
    try {
      const response = await api.get("/get-teachers");
      const loaded = (response.data.teachers || []).map((record) => {
        const assignments = record.teachingAssignments || [];
        const assignedSubjects = [
          ...new Set(
            assignments.flatMap((item) =>
              item.subjectIds.map((entry) => entry.name),
            ),
          ),
        ];
        const assignedClasses = assignments
          .map((item) =>
            item.classId
              ? `${item.classId.name} - ${item.classId.section} (${item.classId.course})`
              : "",
          )
          .filter(Boolean);
        return {
          id: record._id,
          name: record.userId?.name || "Teacher",
          email: record.userId?.email || "",
          phone: record.userId?.phone || "",
          subject: assignedSubjects.length
            ? assignedSubjects
            : record.subjects || [],
          classes: assignedClasses.length
            ? assignedClasses
            : record.classes || [],
          status: record.isActive ? "Active" : "Inactive",
          joined: record.createdAt
            ? new Date(record.createdAt).toLocaleDateString()
            : "",
          createdAt: record.createdAt,
        };
      });
      setTeachers(loaded);
      setLoadError("");
    } catch (error) {
      setLoadError(error.response?.data?.message || "Could not load teachers.");
    }
  }, [canViewTeachers]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  if (!canViewTeachers) {
    return (
      <main className="space-y-5 p-6">
        <h1 className="text-2xl font-bold">Add a teacher</h1>
        <p className="text-sm text-(--text-muted)">
          Teacher records are not visible with your current access.
        </p>
        {canCreateTeacher && (
          <button
            type="button"
            onClick={() => setShowAddTeacher(true)}
            className="rounded-xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={17} className="mr-2 inline" />
            Add Teacher
          </button>
        )}
        {showAddTeacher && (
          <AddTeacherModal
            isAdmin={isAdmin}
            onClose={() => setShowAddTeacher(false)}
            onCreated={loadTeachers}
          />
        )}
      </main>
    );
  }

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        teacher.name.toLowerCase().includes(searchValue) ||
        teacher.email.toLowerCase().includes(searchValue) ||
        teacher.phone.includes(searchValue) ||
        teacher.subject.some((item) =>
          item.toLocaleLowerCase().includes(searchValue),
        );

      const matchesStatus = status === "All" || teacher.status === status;

      const matchesSubject =
        subject === "All" || teacher.subject.includes(subject);

      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [teachers, search, status, subject]);

  return (
    <main className="relative w-full space-y-5 pb-8">
      <FloatingParticles />

      {/* ================= HEADER ================= */}

      <div className="relative z-10 flex flex-col justify-between gap-4 border-b border-(--border) pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users size={21} className="text-(--primary)" />
            Teachers
          </h1>

          <p className="mt-1 text-sm text-(--text-muted)">
            Manage your school's teachers and staff.
          </p>
        </div>

        {canCreateTeacher && (
          <button
            type="button"
            onClick={() => setShowAddTeacher(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={17} />
            Add Teacher
          </button>
        )}
      </div>

      {/* ================= STATS ================= */}

      <section className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TeacherStat
          title="Total Teachers"
          value={teachers.length}
          icon={Users}
        />

        <TeacherStat
          title="Active Teachers"
          value={
            teachers.filter((teacher) => teacher.status === "Active").length
          }
          icon={UserCheck}
        />

        <TeacherStat
          title="Subjects"
          value={new Set(teachers.flatMap((teacher) => teacher.subject)).size}
          icon={BookOpen}
        />

        <TeacherStat
          title="New This Month"
          value={
            teachers.filter((teacher) => {
              const joined = new Date(teacher.createdAt);
              const now = new Date();
              return (
                joined.getMonth() === now.getMonth() &&
                joined.getFullYear() === now.getFullYear()
              );
            }).length
          }
          icon={UserPlus}
        />
      </section>

      {/* ================= FILTER ================= */}

      <section className="relative z-10 rounded-lg border border-(--border) bg-(--primary-soft-hover) p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          {/* Search */}

          <div className="relative w-full xl:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
            />

            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teacher by name, email, phone..."
              className="w-full rounded-md border border-(--border) bg-(--primary-soft) py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-(--primary)"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters */}

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-40">
              <Filter
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-foreground)]"
              />

              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className=" rounded-xl border border-(--border) bg-(--primary-soft) py-2.5 pl-10 pr-8 text-sm text-(--foreground) outline-none focus:border-(--primary)]"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
            <div className="">
              <Select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className=" rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm text-(--foreground) outline-none focus:border-(--primary)]"
              >
                <option value="All">All Subjects</option>
                {[...new Set(teachers.flatMap((teacher) => teacher.subject))]
                  .sort()
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
        </div>
      </section>

      {loadError && (
        <p
          role="alert"
          className="relative z-10 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600"
        >
          {loadError}
        </p>
      )}

      {/* ================= TEACHER TABLE ================= */}

      <section className="relative z-10 overflow-hidden rounded-lg border border-(--border) bg-(--glass-bg)">
        <div className="flex flex-col justify-between gap-2 border-b border-(--border) p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold">All Teachers</h2>

            <p className="text-sm text-(--text-muted)">
              {filteredTeachers.length} teachers found
            </p>
          </div>
        </div>

        {/* Desktop Table */}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-225">
            <thead>
              <tr className="border-b border-(--border) text-left text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-(--text) font-semibold">
                  Teacher
                </th>

                <th className="px-5 py-3 text-(--text) font-semibold">
                  Subject
                </th>

                <th className="px-5 py-3 text-(--text) font-semibold">
                  Classes
                </th>

                <th className="px-5 py-3 text-(--text) font-semibold">
                  Contact
                </th>

                <th className="px-5 py-3 text-(--text) font-semibold">
                  Status
                </th>

                <th className="px-5 py-3 text-(--text) font-semibold">
                  Joined
                </th>

                <th className="px-5 py-3 text-right text-(--text) font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <TeacherRow key={teacher.id} teacher={teacher} />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users size={35} className="text-(--text-muted)" />

                      <p className="mt-3 font-medium text-(--text)">
                        No teachers found
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

        {/* Mobile Cards */}

        <div className="divide-y divide-(--border) md:hidden">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <TeacherMobileCard key={teacher.id} teacher={teacher} />
            ))
          ) : (
            <div className="px-5 py-12 text-center">
              <Users size={35} className="mx-auto text-gray-300" />

              <p className="mt-3 font-medium">No teachers found</p>
            </div>
          )}
        </div>

        {/* Pagination */}

        <div className="flex items-center justify-between border-t border-(--border) px-5 py-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">1</span> -{" "}
            <span className="font-medium text-gray-700">
              {filteredTeachers.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">
              {filteredTeachers.length}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md border border-(--border) p-2 text-gray-400"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="rounded-md bg-(--primary) px-3 py-1.5 text-sm text-white"
            >
              1
            </button>

            <button
              type="button"
              className="rounded-md border border-(--border) p-2"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ================= ADD TEACHER MODAL ================= */}

      {showAddTeacher && (
        <AddTeacherModal
          isAdmin={isAdmin}
          onClose={() => setShowAddTeacher(false)}
          onCreated={loadTeachers}
        />
      )}
    </main>
  );
};

/* ========================================================= */
/*                      STAT CARD                            */
/* ========================================================= */

const TeacherStat = ({ title, value, icon: Icon }) => {
  return (
    <div className="rounded-lg border border-(--border) bg-linear-45 backdrop-blur-sm from-(--card-gradient-1) to-(--card-gradient-2)/10 p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="mt-2 text-2xl font-bold">{value}</h2>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg ">
          <Icon size={20} className="text-(--primary)" />
        </div>
      </div>
    </div>
  );
};

/* ========================================================= */
/*                      TEACHER ROW                         */
/* ========================================================= */

const TeacherRow = ({ teacher }) => {
  const navigate = useNavigate();
  return (
    <tr
      className="border-b border-(--border) last:border-0 hover:bg-(--glass-bg)"
      onClick={() => navigate(`/teachers/details/${teacher.id}`)}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3 text-(--ṭext)">
          <Avatar name={teacher.name} />

          <div>
            <p className="font-medium text-(--text)">{teacher.name}</p>

            <p className="text-xs text-(--text-muted)">
              ID: TCH-{String(teacher.id).padStart(4, "0")}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-(--ṭext)">
        <div className="flex flex-wrap gap-2">
          {teacher.subject.map((item) => (
            <div key={item} className="text-(--text)">
              {item}
            </div>
          ))}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1 text-(--text)">
          {teacher.classes.map((item) => (
            <span
              key={item}
              className="rounded bg-(--primary-soft) px-2 py-1 text-xs font-medium text-(--text)"
            >
              Class {item}
            </span>
          ))}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-(--text)">
            <Mail size={13} />
            {teacher.email}
          </p>

          <p className="flex items-center gap-1 text-xs text-(--text)">
            <Phone size={13} />
            {teacher.phone}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={teacher.status} />
      </td>

      <td className="px-5 py-4 text-sm text-(--text)">{teacher.joined}</td>

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

/* ========================================================= */
/*                   MOBILE TEACHER CARD                    */
/* ========================================================= */

const TeacherMobileCard = ({ teacher }) => {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={teacher.name} />

          <div>
            <p className="font-medium">{teacher.name}</p>

            <p className="text-xs text-gray-500">{teacher.subject}</p>
          </div>
        </div>

        <button type="button" className="rounded-md p-1.5 hover:bg-gray-100">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Classes</p>

          <div className="mt-1 flex flex-wrap gap-1">
            {teacher.classes.map((item) => (
              <span
                key={item}
                className="rounded bg-(--primary-soft) px-2 py-1 text-xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400">Status</p>

          <div className="mt-1">
            <StatusBadge status={teacher.status} />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1 border-t border-(--border) pt-3">
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <Mail size={13} />
          {teacher.email}
        </p>

        <p className="flex items-center gap-2 text-xs text-gray-500">
          <Phone size={13} />
          {teacher.phone}
        </p>
      </div>
    </div>
  );
};

/* ========================================================= */
/*                         AVATAR                            */
/* ========================================================= */

const Avatar = ({ name }) => {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--primary-soft) font-semibold text-(--primary)">
      {initials}
    </div>
  );
};

/* ========================================================= */
/*                       STATUS BADGE                        */
/* ========================================================= */

const StatusBadge = ({ status }) => {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-(--success)/10 text-green-700"
          : "bg-(--warning)/10 text-(--warning)"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-(--success)" : "bg-(--warning)"
        }`}
      />

      {status}
    </span>
  );
};

/* ========================================================= */
/*                     ACTION BUTTON                         */
/* ========================================================= */

const ActionButton = ({ icon: Icon, title, danger = false }) => {
  return (
    <button
      type="button"
      title={title}
      className={`rounded-md p-2 transition ${
        danger
          ? "text-(--warning) hover:bg-(--warning)/10"
          : "text-(--text) hover:bg-(--primary-soft) hover:text-(--primary)"
      }`}
    >
      <Icon size={16} />
    </button>
  );
};

/* ========================================================= */
/*                  ADD TEACHER MODAL                        */
/* ========================================================= */

const AddTeacherModal = ({ isAdmin, onClose, onCreated }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    employeeId: "",
    gender: "",
    role: "",
    dateOfBirth: "",
    address: "",
    experience: "",
    joiningDate: "",
    designation: "Teacher",
  });

  useEffect(() => {
    api
      .get("/get-classes")
      .then((response) => {
        const records = response.data.classes || [];
        setClasses(records);
        // setSelectedClassId(records[0]?._id || "");
      })
      .catch((error) => {
        setErrorMessage(
          error.response?.data?.message || "Could not load classes.",
        );
      });
  }, []);

  useEffect(() => {
    setAvailableSubjects([]);
    setSelectedSubjectIds([]);
    if (!selectedClassId) return;
    api
      .get("/get-subject", { params: { classId: selectedClassId } })
      .then((response) => setAvailableSubjects(response.data.getSubject || []))
      .catch((error) => {
        setErrorMessage(
          error.response?.data?.message || "Could not load class subjects.",
        );
      });
  }, [selectedClassId]);

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  };

  const addClassAssignment = () => {
    if (!selectedClassId || selectedSubjectIds.length === 0) {
      setErrorMessage("Select a class and at least one subject.");
      return;
    }
    setAssignments((current) => [
      ...current.filter((item) => item.classId !== selectedClassId),
      {
        classId: selectedClassId,
        subjectIds: selectedSubjectIds,
        subjectNames: availableSubjects
          .filter((item) => selectedSubjectIds.includes(item._id))
          .map((item) => item.name),
      },
    ]);
    setSelectedSubjectIds([]);
    setErrorMessage("");
  };

  const submitTeacher = async (event) => {
    event.preventDefault();
    if (assignments.length === 0) {
      setErrorMessage("Add at least one class and subject assignment.");
      return;
    }
    setIsSaving(true);
    setErrorMessage("");
    try {
      await api.post("/add-teacher", {
        ...formData,
        gender: formData.gender || undefined,
        experience: formData.experience ? Number(formData.experience) : 0,
        dateOfBirth: formData.dateOfBirth || undefined,
        joiningDate: formData.joiningDate || undefined,
        role: formData.role || undefined,
        address: { street: formData.address },
        assignments: assignments.map(({ classId, subjectIds }) => ({
          classId,
          subjectIds,
        })),
      });
      await onCreated();
      onClose();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not create teacher.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md "
      // onClick={(e) => {
      //   if (e.target === e.currentTarget) {
      //     onClose();
      //   }
      // }}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-none rounded-xl bg-(--primary-soft-hover) shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border) bg-(--surface) px-5 py-4 shadow-xl">
          <div>
            <h2 className="text-lg font-bold">Add Teacher</h2>
            <p className="text-sm text-(--text-muted)">
              Add a teacher and assign subjects by class.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={19} />
          </button>
        </div>

        <form className="space-y-5 p-5" onSubmit={submitTeacher}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="">
              <Label required>Full Name</Label>
              <Input
                required
                value={formData.name}
                onChange={updateField("name")}
                placeholder="Full name"
                className="bg-(--primary-soft)"
              />
            </div>

            <div className="">
              <Label required>Email</Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={updateField("email")}
                placeholder="Email address"
                className="bg-(--primary-soft)"
              />
            </div>
            <div className="">
              <Label required>Phone</Label>
              <Input
                required
                type="tel"
                value={formData.phone}
                onChange={updateField("phone")}
                placeholder="Phone number"
                className="bg-(--primary-soft)"
              />
            </div>
            <div className="">
              <Label required>InitialPassword</Label>
              <Input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={formData.password}
                onChange={updateField("password")}
                placeholder="Initial password (8+ characters)"
                className="bg-(--primary-soft)"
              />
            </div>
            <div className="">
              <Label required>Employee ID</Label>
              <Input
                required
                value={formData.employeeId}
                onChange={updateField("employeeId")}
                placeholder="Employee ID"
                className="bg-(--primary-soft)"
              />
            </div>
            <div className="">
              <Label required>Select Gender</Label>
              <Select
                value={formData.gender}
                onChange={updateField("gender")}
                className="rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm"
              >
                <option value="">Select gender </option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>

            <div className="">
              <Label required>Date Of Birth</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={updateField("dateOfBirth")}
                aria-label="Date of birth"
                className="bg-(--primary-soft)"
              />
            </div>
            <div className="">
              <Label required>Experience</Label>
              <Input
                type="number"
                min="0"
                value={formData.experience}
                onChange={updateField("experience")}
                placeholder="Experience (years)"
                className="bg-(--primary-soft)"
              />
            </div>

            <div className="">
              <Label required>Designation</Label>
              <Input
                value={formData.designation}
                onChange={updateField("designation")}
                placeholder="Designation"
                className="bg-(--primary-soft)"
              />
            </div>
            <div className="">
              <Label required>Select Role</Label>
              <Select
                value={formData.role}
                onChange={updateField("role")}
                className="rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm"
              >
                <option value="">Select Role</option>
                <option value="Staff">Staff</option>
                {isAdmin && <option value="Admin">School Admin</option>}
              </Select>
            </div>
            <div className="">
              <Label required>Joining Date</Label>
              <Input
                type="date"
                value={formData.joiningDate}
                onChange={updateField("joiningDate")}
                aria-label="Joining date"
                className="bg-(--primary-soft)"
              />
            </div>
            <div className="">
              <Label required>Address</Label>
              <Input
                value={formData.address}
                onChange={updateField("address")}
                placeholder="Address"
                className="bg-(--primary-soft)"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-(--border) p-4">
            <h3 className="font-semibold">Assign class and subjects</h3>
            <Select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              disabled={classes.length === 0}
              className="rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm"
            >
              <option value="">Select a class</option>
              {classes.map((record) => (
                <option key={record._id} value={record._id}>
                  {record.name} - {record.section} ({record.course})
                </option>
              ))}
            </Select>
            {selectedClassId && availableSubjects.length === 0 ? (
              <p className="text-sm text-(--text-muted)">
                No subjects for this class. Add them in Settings first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((item) => (
                  <label
                    key={item._id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-(--border) px-3 py-2 text-sm hover:border-(--primary)"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(item._id)}
                      onChange={() => toggleSubject(item._id)}
                      className="accent-(--primary)"
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled={!selectedClassId || availableSubjects.length === 0}
              onClick={addClassAssignment}
              className="rounded-lg border border-(--primary) px-3 py-2 text-sm font-medium text-(--primary) disabled:opacity-50"
            >
              Add class assignment
            </button>
            {assignments.map((assignment) => {
              const record = classes.find(
                (item) => item._id === assignment.classId,
              );
              return (
                <div
                  key={assignment.classId}
                  className="flex items-start justify-between gap-3 rounded-lg bg-(--primary-soft) p-3 text-sm"
                >
                  <span>
                    <strong>
                      {record ? `${record.name} - ${record.section}` : "Class"}
                    </strong>
                    <span className="ml-2">
                      {assignment.subjectNames.join(", ")}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="Remove class assignment"
                    onClick={() =>
                      setAssignments((current) =>
                        current.filter(
                          (item) => item.classId !== assignment.classId,
                        ),
                      )
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600"
            >
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-(--border) pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-(--border) px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || classes.length === 0}
              className="rounded-md bg-(--primary) px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================= */
/*                       FORM FIELD                          */
/* ========================================================= */

export default Teachers;
