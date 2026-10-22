import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  UserRound,
  Users,
  Clock3,
  IndianRupee,
  BookOpen,
  Download,
  Pencil,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  Wallet,
  Activity,
  FileText,
  TrendingUp,
  ShieldCheck,
  School,
} from "lucide-react";
import { api } from "../../services/api";

const emptyStudent = {
  _id: "",
  name: "",
  admissionNumber: "",
  rollNumber: "",
  className: "",
  section: "",
  academicSession: "",
  status: "Inactive",
  personal: {},
  parent: {},
  attendance: { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
  fees: { total: 0, paid: 0, pending: 0, nextDue: "Not provided" },
  attendanceHistory: [],
  activities: [],
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not provided";

const attendanceColors = {
  Present: "#16a34a",
  Absent: "#ef4444",
  Late: "#3b82f6",
  Leave: "#f59e0b",
};

const activityIcons = {
  attendance: CalendarCheck,
  fee: Wallet,
  academic: GraduationCap,
  profile: UserRound,
};

const activityColors = {
  attendance: "bg-emerald-50 text-emerald-600",
  fee: "bg-blue-50 text-blue-600",
  academic: "bg-violet-50 text-violet-600",
  profile: "bg-amber-50 text-amber-600",
};

// --------------------------------------------------
// REUSABLE COMPONENTS
// --------------------------------------------------

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>

      {action}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-linear-45 backdrop-blur-sm from-(--card-gradient-1) to-(--card-gradient-2)/10 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-800">{value}</h3>
          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {Icon && (
        <div className="mt-0.5 text-slate-400">
          <Icon size={17} />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-800">
          {value === undefined || value === null || value === ""
            ? "Not provided"
            : value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    Present: "bg-emerald-50 text-emerald-700",
    Absent: "bg-red-50 text-red-700",
    Leave: "bg-amber-50 text-amber-700",
    Active: "bg-emerald-50 text-emerald-700",
    Inactive: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        classes[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

export default function StudentDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("Overview");
  const [student, setStudent] = useState(emptyStudent);
  const [studentDetails, setStudentDetails] = useState({
    feeAccounts: [],
    leaveRequests: [],
    admissionApplications: [],
    subjects: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getStudentDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get(`/student-alldetails/${id}`);
      if (!data.success || !data.student) {
        throw new Error("Student details could not be loaded.");
      }

      const record = data.student;
      const attendance = data.attendance || {};
      const fees = data.fees || {};
      const attendanceHistory = (attendance.records || []).map((item) => ({
        date: formatDate(item.date),
        day: new Date(item.date).toLocaleDateString("en-IN", {
          weekday: "long",
        }),
        status: item.status,
      }));

      setStudent({
        _id: record._id,
        name: record.name,
        photo: record.photo,
        admissionNumber: record.admissionNumber,
        rollNumber: record.rollNumber,
        className: record.classId?.name,
        section: record.classId?.section,
        academicSession: data.academicSession || "Not provided",
        course: record.classId?.course,
        status: record.isActive ? "Active" : "Inactive",
        personal: {
          dob: formatDate(record.dateOfBirth),
          gender: record.gender,
          email: record.email,
          phone: record.phone,
          address: record.address,
          admissionDate: formatDate(record.createdAt),
          updatedAt: formatDate(record.updatedAt),
        },
        parent: {
          guardianName: record.guardianName,
          phone: record.guardianPhone,
        },
        attendance: {
          present: attendance.present || 0,
          absent: attendance.absent || 0,
          late: attendance.late || 0,
          leave: attendance.leave || 0,
          total: attendance.total || 0,
        },
        fees: {
          total: fees.total || 0,
          paid: fees.paid || 0,
          pending: fees.pending || 0,
          nextDue: formatDate(fees.nextDue),
        },
        attendanceHistory,
        activities: (data.activities || []).map((activity) => ({
          ...activity,
          date: formatDate(activity.date),
        })),
      });
      setStudentDetails({
        feeAccounts: fees.accounts || [],
        leaveRequests: data.leaveRequests || [],
        admissionApplications: data.admissionApplications || [],
        subjects: data.subjects || [],
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load student details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "NexaManage | Student Details";
    getStudentDetail();
  }, [id]);

  const attendancePercentage = useMemo(() => {
    const { present, total } = student.attendance;

    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, [student.attendance]);
  const feePercentage =
    student.fees.total > 0
      ? Math.min(
          Math.round((student.fees.paid / student.fees.total) * 100),
          100,
        )
      : 0;

  const attendanceChartData = [
    { name: "Present", value: student.attendance.present },
    { name: "Absent", value: student.attendance.absent },
    { name: "Late", value: student.attendance.late },
    { name: "Leave", value: student.attendance.leave },
  ];

  const tabs = ["Overview", "Attendance", "Academics", "Fees", "Activities"];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading student details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate("/students")}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen border-2 rounded-lg border-(--border) bg-white/20 backdrop-blur-lg p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* TOP NAVIGATION */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/students")}
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-(--primary)"
            >
              <ArrowLeft size={17} />
              Back to Students
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-(--text) sm:text-3xl">
              Student Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View student information, attendance, academics and activities.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/students/edit/${student._id}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Pencil size={16} />
              Edit Profile
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Download size={16} />
              Print Profile
            </button>
          </div>
        </div>

        {/* PROFILE HERO */}

        <section className="overflow-hidden rounded-2xl border border-slate-200  shadow-sm">
          <div className="h-30 bg-linear-to-bl from-(--card-gradient-1) via-(--card-gradient-2) to-(--card-gradient-1) sm:h-25 " />

          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-50 text-3xl font-bold text-blue-600 shadow-md sm:h-28 sm:w-28">
                  {student.photo?.url ? (
                    <img
                      src={student.photo?.url}
                      alt={`${student.name} photo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    student.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      {student.name}
                    </h2>
                    <StatusBadge status={student.status} />
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Admission No. {student.admissionNumber}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap size={16} className="text-blue-600" />
                      {student.className || "Class not assigned"} - Section{" "}
                      {student.section || "Not assigned"}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Users size={16} className="text-blue-600" />
                      Roll No. {student.rollNumber || student.admissionNumber}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={16} className="text-blue-600" />
                      Session {student.academicSession}
                    </span>
                    {student.course && (
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen size={16} className="text-blue-600" />
                        {student.course}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium text-emerald-700">
                  Attendance Rate
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {attendancePercentage}%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK STATS */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Days Present"
            value={student.attendance.present}
            subtitle="All recorded attendance"
            icon={CheckCircle2}
            tone="green"
          />

          <StatCard
            title="Days Absent"
            value={student.attendance.absent}
            subtitle="Recorded absences"
            icon={XCircle}
            tone="red"
          />

          <StatCard
            title="Fees Paid"
            value={formatCurrency(student.fees.paid)}
            subtitle={`${
              student.fees.total
                ? Math.round((student.fees.paid / student.fees.total) * 100)
                : 0
            }% of total fees`}
            icon={Wallet}
            tone="blue"
          />

          <StatCard
            title="Academic Score"
            value="N/A"
            subtitle="Exam results are not available"
            icon={TrendingUp}
            tone="amber"
          />
        </section>

        {/* TABS */}

        <div className="overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max gap-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW TAB */}

        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* PERSONAL DETAILS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 xl:col-span-2">
              <SectionTitle
                title="Personal Information"
                subtitle="Student's personal and contact details"
              />

              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <DetailItem
                  label="Full Name"
                  value={student.name}
                  icon={UserRound}
                />

                <DetailItem
                  label="Date of Birth"
                  value={student.personal.dob}
                  icon={CalendarDays}
                />

                <DetailItem
                  label="Gender"
                  value={student.personal.gender}
                  icon={UserRound}
                />

                <DetailItem
                  label="Email Address"
                  value={student.personal.email}
                  icon={Mail}
                />

                <DetailItem
                  label="Phone Number"
                  value={student.personal.phone}
                  icon={Phone}
                />

                <DetailItem
                  label="Admission Date"
                  value={student.personal.admissionDate}
                  icon={CalendarDays}
                />

                <DetailItem
                  label="Academic Session"
                  value={student.academicSession}
                  icon={School}
                />

                <DetailItem
                  label="Last Updated"
                  value={student.personal.updatedAt}
                  icon={CalendarDays}
                />
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2">
                <DetailItem
                  label="Residential Address"
                  value={student.personal.address}
                  icon={MapPin}
                />
              </div>
            </section>

            {/* ATTENDANCE PIE CHART */}

            <section className="rounded-2xl border border-slate-200 bg-(--surface) p-5 sm:p-6">
              <SectionTitle
                title="Attendance Summary"
                subtitle="Breakdown of all recorded attendance"
              />

              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {attendanceChartData.map((item) => (
                        <Cell
                          key={item.name}
                          fill={attendanceColors[item.name]}
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">
                    {attendancePercentage}%
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Attendance
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {attendanceChartData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: attendanceColors[item.name],
                        }}
                      />
                      <span className="text-slate-600">{item.name}</span>
                    </div>

                    <span className="font-semibold text-slate-800">
                      {item.value} days
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* PARENT DETAILS */}

            <section className="rounded-2xl border border-slate-200 bg-(--surface) p-5 sm:p-6">
              <SectionTitle
                title="Parent / Guardian"
                subtitle="Emergency and family contact information"
              />

              <div className="space-y-2">
                <DetailItem
                  label="Guardian Name"
                  value={student.parent.guardianName}
                  icon={UserRound}
                />

                <DetailItem
                  label="Contact Number"
                  value={student.parent.phone}
                  icon={Phone}
                />
              </div>
            </section>

            {/* FEE SUMMARY */}

            <section className="rounded-2xl border border-slate-200 bg-(--surface) p-5 sm:p-6 xl:col-span-2">
              <SectionTitle
                title="Fee Summary"
                subtitle="Overview of the student's fee payments"
                action={
                  <button
                    onClick={() => setActiveTab("Fees")}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View details
                  </button>
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total Fees</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatCurrency(student.fees.total)}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">Paid Amount</p>
                  <p className="mt-2 text-xl font-bold text-emerald-700">
                    {formatCurrency(student.fees.paid)}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">Pending Amount</p>
                  <p className="mt-2 text-xl font-bold text-amber-700">
                    {formatCurrency(student.fees.pending)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-500">Payment progress</span>
                  <span className="font-semibold text-slate-700">
                    {feePercentage}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${feePercentage}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Next due date:{" "}
                  <span className="font-semibold text-slate-700">
                    {student.fees.nextDue}
                  </span>
                </p>
              </div>
            </section>

            {/* RECENT ACTIVITIES */}

            <section className="rounded-2xl border border-slate-200 bg-(--surface) p-5 sm:p-6 xl:col-span-2">
              <SectionTitle
                title="Recent Activities"
                subtitle="Recent events associated with this student"
                action={
                  <button
                    onClick={() => setActiveTab("Activities")}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View all
                  </button>
                }
              />

              <div className="space-y-5">
                {student.activities.slice(0, 4).map((activity, index) => {
                  const Icon = activityIcons[activity.type] || Activity;

                  return (
                    <div
                      key={`${activity.title}-${index}`}
                      className="flex gap-3"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          activityColors[activity.type] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap justify-between gap-2">
                          <h3 className="text-sm font-semibold text-slate-800">
                            {activity.title}
                          </h3>

                          <span className="text-xs text-slate-400">
                            {activity.date}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* PROFILE STATUS */}

            <section className="rounded-2xl border border-slate-200 bg-(--surface) p-5 sm:p-6">
              <SectionTitle title="Profile Status" />

              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                <ShieldCheck size={22} className="shrink-0 text-emerald-600" />

                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Student is {student.status.toLowerCase()}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    Admission date: {student.personal.admissionDate}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <DetailItem
                  label="Admission Number"
                  value={student.admissionNumber}
                />

                <DetailItem label="Student ID" value={student._id} />
              </div>
            </section>
          </div>
        )}

        {/* ATTENDANCE TAB */}

        {activeTab === "Attendance" && (
          <section className="rounded-2xl border border-slate-200 bg-(--surface) p-5 sm:p-6">
            <SectionTitle
              title="Attendance History"
              subtitle="All recorded attendance"
              action={
                <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  {attendancePercentage}% attendance
                </span>
              }
            />

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                title="Present"
                value={student.attendance.present}
                icon={CheckCircle2}
                tone="green"
              />

              <StatCard
                title="Absent"
                value={student.attendance.absent}
                icon={XCircle}
                tone="red"
              />

              <StatCard
                title="Late"
                value={student.attendance.late}
                icon={Clock3}
                tone="blue"
              />

              <StatCard
                title="Leave"
                value={student.attendance.leave}
                icon={CalendarDays}
                tone="amber"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-(--black)/40 text-xs uppercase text-slate-500">
                    <th className="px-4 py-3 text-(--text) font-semibold">
                      Date
                    </th>
                    <th className="px-4 py-3 text-(--text) font-semibold">
                      Day
                    </th>
                    <th className="px-4 py-3 text-(--text) font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {student.attendanceHistory.map((record) => (
                    <tr
                      key={`${record.date}-${record.status}`}
                      className="border-b border-slate-100 last:border-0 hover:bg-()"
                    >
                      <td className="px-4 py-4 font-medium text-slate-800">
                        {record.date}
                      </td>

                      <td className="px-4 py-4 text-slate-500">{record.day}</td>

                      <td className="px-4 py-4">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!student.attendanceHistory.length && (
              <p className="mt-4 text-sm text-slate-500">
                No attendance records are available.
              </p>
            )}
          </section>
        )}

        {/* ACADEMICS TAB */}

        {activeTab === "Academics" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <SectionTitle
              title="Academic Performance"
              subtitle="Subjects assigned to the student's class"
            />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                title="Overall Percentage"
                value="N/A"
                icon={TrendingUp}
                tone="green"
              />

              <StatCard
                title="Subjects"
                value={studentDetails.subjects.length}
                icon={BookOpen}
                tone="blue"
              />

              <StatCard
                title="Academic Session"
                value={student.academicSession}
                icon={GraduationCap}
                tone="amber"
              />
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800">Class Subjects</h3>
              {studentDetails.subjects.length ? (
                <p className="mt-2 text-sm text-slate-600">
                  {studentDetails.subjects
                    .map((subject) => subject.name)
                    .join(", ")}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  No subjects are assigned to this class.
                </p>
              )}
              <p className="mt-2 text-sm text-slate-500">
                Exam marks are not part of the available student records.
              </p>
            </div>
          </section>
        )}

        {/* FEES TAB */}

        {activeTab === "Fees" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <SectionTitle
              title="Fee Management"
              subtitle="Student fee payment overview"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                title="Total Fees"
                value={formatCurrency(student.fees.total)}
                icon={IndianRupee}
                tone="blue"
              />

              <StatCard
                title="Paid"
                value={formatCurrency(student.fees.paid)}
                icon={CheckCircle2}
                tone="green"
              />

              <StatCard
                title="Outstanding"
                value={formatCurrency(student.fees.pending)}
                icon={Wallet}
                tone="amber"
              />
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <CalendarDays size={22} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">Next Due Date</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {student.fees.nextDue}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${feePercentage}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-500">
                {formatCurrency(student.fees.pending)} remaining out of{" "}
                {formatCurrency(student.fees.total)}.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-slate-800">
                Fee Accounts & Payments
              </h3>
              {studentDetails.feeAccounts.length ? (
                studentDetails.feeAccounts.map((account) => (
                  <div
                    key={account._id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="grid gap-3 sm:grid-cols-4">
                      <DetailItem
                        label="Academic Session"
                        value={account.academicSession}
                      />
                      <DetailItem
                        label="Total Amount"
                        value={formatCurrency(account.totalAmount)}
                      />
                      <DetailItem
                        label="Paid Amount"
                        value={formatCurrency(account.paidAmount)}
                      />
                      <DetailItem
                        label="Pending Amount"
                        value={formatCurrency(
                          Math.max(account.totalAmount - account.paidAmount, 0),
                        )}
                      />
                      <DetailItem
                        label="Due Date"
                        value={formatDate(account.dueDate)}
                      />
                    </div>
                    <h4 className="mt-3 text-sm font-semibold text-slate-700">
                      Payments
                    </h4>
                    {account.payments?.length ? (
                      <div className="mt-2 space-y-2">
                        {account.payments.map((payment) => (
                          <div
                            key={payment._id}
                            className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"
                          >
                            <span>
                              {formatCurrency(payment.amount)} ·{" "}
                              {payment.method}
                              {payment.reference
                                ? ` · Ref: ${payment.reference}`
                                : ""}
                            </span>
                            <span className="text-slate-500">
                              {formatDate(payment.paidAt)} · Received by{" "}
                              {payment.receivedBy?.name || "Not provided"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        No payments recorded.
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No fee accounts found.</p>
              )}
            </div>
          </section>
        )}

        {/* ACTIVITIES TAB */}

        {activeTab === "Activities" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <SectionTitle
              title="Student Activity Timeline"
              subtitle="Recorded events associated with this student"
            />

            <div className="relative ml-2 space-y-7 border-l border-slate-200 pl-7">
              {student.activities.map((activity, index) => {
                const Icon = activityIcons[activity.type] || Activity;

                return (
                  <div key={`${activity.title}-${index}`} className="relative">
                    <div
                      className={`absolute -left-[43px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${
                        activityColors[activity.type] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={15} />
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {activity.title}
                      </h3>

                      <span className="text-xs text-slate-400">
                        {activity.date}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {activity.description}
                    </p>
                  </div>
                );
              })}
            </div>
            {!student.activities.length && (
              <p className="mt-4 text-sm text-slate-500">
                No activities recorded.
              </p>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800">Leave Requests</h3>
                {studentDetails.leaveRequests.length ? (
                  <div className="mt-4 space-y-4">
                    {studentDetails.leaveRequests.map((request) => (
                      <article
                        key={request._id}
                        className="border-t border-slate-100 pt-3"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <StatusBadge status={request.status} />
                          <span className="text-xs text-slate-500">
                            {formatDate(request.fromDate)} –{" "}
                            {formatDate(request.toDate)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                          {request.reason}
                        </p>
                        <DetailItem
                          label="Guardian Phone"
                          value={request.guardianPhone}
                          icon={Phone}
                        />
                        <DetailItem
                          label="Review Note"
                          value={request.reviewNote}
                          icon={FileText}
                        />
                        <DetailItem
                          label="Reviewed By"
                          value={request.reviewedBy?.name}
                          icon={UserRound}
                        />
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No leave requests found.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800">
                  Admission Applications
                </h3>
                {studentDetails.admissionApplications.length ? (
                  <div className="mt-4 space-y-4">
                    {studentDetails.admissionApplications.map((application) => (
                      <article
                        key={application._id}
                        className="border-t border-slate-100 pt-3"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="font-medium text-slate-800">
                            {application.applicantName}
                          </p>
                          <StatusBadge status={application.status} />
                        </div>
                        <DetailItem
                          label="Requested Class"
                          value={application.requestedClass}
                          icon={GraduationCap}
                        />
                        <DetailItem
                          label="Date of Birth"
                          value={formatDate(application.dateOfBirth)}
                          icon={CalendarDays}
                        />
                        <DetailItem
                          label="Gender"
                          value={application.gender}
                          icon={UserRound}
                        />
                        <DetailItem
                          label="Guardian"
                          value={application.guardianName}
                          icon={Users}
                        />
                        <DetailItem
                          label="Guardian Phone"
                          value={application.guardianPhone}
                          icon={Phone}
                        />
                        <DetailItem
                          label="Email"
                          value={application.email}
                          icon={Mail}
                        />
                        <DetailItem
                          label="Address"
                          value={application.address}
                          icon={MapPin}
                        />
                        <DetailItem
                          label="Review Note"
                          value={application.reviewNote}
                          icon={FileText}
                        />
                        <DetailItem
                          label="Reviewed By"
                          value={application.reviewedBy?.name}
                          icon={UserRound}
                        />
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No linked admission applications found.
                  </p>
                )}
              </section>
            </div>
          </section>
        )}

        {/* FOOTER */}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400">
          <p>NexaManage · Student Management</p>
          <p>Student ID: {id || student._id}</p>
        </footer>
      </div>
    </div>
  );
}
