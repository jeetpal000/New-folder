import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  CircleAlert,
  GraduationCap,
  IndianRupee,
  School,
  Users,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FloatingParticles from "./FloatingParticles/FloatingPartcles";
import SchoolIdentityCarousel from "./SchoolIdentityCarousel";
import { formatDate } from "../utils/date";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [dismissedFees, setDismissedFees] = useState(() => new Set());

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const response = await api.get("/dashboard/admin");
      setDashboard(response.data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Admin dashboard data could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    document.title = "NexaManage | Admin Dashboard";
    loadDashboard();
  }, [loadDashboard]);

  const date = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  const visibleDues = (dashboard?.fees?.dues || []).filter(
    (fee) => !dismissedFees.has(String(fee.id)),
  );

  return (
    <main className="relative min-h-screen overflow-hidden px-3 pb-8 sm:px-5">
      <FloatingParticles />
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <SchoolIdentityCarousel />
        <header className="flex flex-col justify-between gap-4 border-b border-(--border) pb-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-(--primary)">
              School administration
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {greeting}, {user?.name || "Admin"}
            </h1>
            <p className="mt-1 text-sm text-(--text-muted)">
              School-wide operations and attendance at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--glass-bg) px-3 py-2 text-sm">
            <CalendarDays size={17} className="text-(--primary)" />
            {date}
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{error}</span>
            <button
              className="font-semibold underline"
              onClick={loadDashboard}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {!dashboard && !error && (
          <div className="rounded-xl border border-(--border) bg-(--glass-bg) p-8 text-center text-(--text-muted)">
            Loading school overview…
          </div>
        )}

        {dashboard && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total students"
                value={dashboard.studentTotal}
                icon={GraduationCap}
                detail="Active enrolments"
              />
              <StatCard
                label="Teachers"
                value={dashboard.teacherTotal}
                icon={Users}
                detail="Active teaching staff"
              />
              <StatCard
                label="Classes"
                value={dashboard.classTotal}
                icon={School}
                detail="Active class sections"
              />
              <StatCard
                label="Staff accounts"
                value={dashboard.staffTotal}
                icon={UserRoundCheck}
                detail="Active school accounts"
              />
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <FeeSummaryCard
                label="Fees collected"
                value={formatCurrency(dashboard.fees.totalCollected)}
                detail={`Billed ${formatCurrency(dashboard.fees.totalBilled)}`}
              />
              <FeeSummaryCard
                label="Outstanding fees"
                value={formatCurrency(dashboard.fees.outstandingBalance)}
                detail={`${dashboard.fees.accountsWithDue} fee accounts with a balance`}
                warning={dashboard.fees.outstandingBalance > 0}
              />
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-(--border) bg-(--glass-bg) p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-(--text-muted)">
                      Overdue accounts
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {dashboard.fees.overdueAccounts}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                    <CircleAlert size={20} />
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/fees")}
                  className="w-fit rounded-lg bg-(--primary) px-4 py-2 text-sm font-semibold text-white"
                >
                  Handle Fees
                </button>
              </div>
            </section>

            {visibleDues.length > 0 && (
              <section
                aria-label="Outstanding student fee alerts"
                className="rounded-2xl border border-(--warning) bg-(--danger)/40 backdrop-blur-md p-5 sm:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-bold text-(--warning) ">
                      <CircleAlert size={19} />
                      Fees pending
                    </h2>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                      Students with unpaid balances. Dismiss an alert with ×.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/fees")}
                    className="rounded-lg border border-amber-400 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/30"
                  >
                    Handle Fees
                  </button>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {visibleDues.map((fee) => (
                    <article
                      key={fee.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-white/80 p-4 dark:border-amber-900 dark:bg-black/10"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {fee.studentName}
                        </p>
                        <p className="mt-1 text-xs text-(--text-muted)">
                          {fee.admissionNumber} · {fee.className}
                          {fee.section ? ` · ${fee.section}` : ""} ·{" "}
                          {fee.academicSession}
                        </p>
                        <p className="mt-2 text-sm">
                          Balance:{" "}
                          <strong>{formatCurrency(fee.dueAmount)}</strong>
                          {fee.dueDate && (
                            <span className="ml-2 text-xs text-(--text-muted)">
                              Due{" "}
                              {formatDate(fee.dueDate)}
                              {fee.overdue ? " · Overdue" : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Dismiss fee alert for ${fee.studentName}`}
                        title="Dismiss alert"
                        onClick={() =>
                          setDismissedFees((current) =>
                            new Set(current).add(String(fee.id)),
                          )
                        }
                        className="shrink-0 rounded-lg p-1.5 text-(--text-muted) hover:bg-amber-100 hover:text-(--text) dark:hover:bg-amber-900/40"
                      >
                        <X size={18} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-(--primary-soft)">
                    <Activity size={21} className="text-(--primary)" />
                  </div>
                  <div>
                    <h2 className="font-bold">Today’s attendance</h2>
                    <p className="text-sm text-(--text-muted)">
                      Based on attendance records submitted today
                    </p>
                  </div>
                </div>
                <p className="my-6 text-5xl font-bold text-(--primary)">
                  {dashboard.todayAttendance.rate}%
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-(--primary-soft-hover)/50">
                  <div
                    className="h-full rounded-full bg-(--primary) transition-all"
                    style={{ width: `${dashboard.todayAttendance.rate}%` }}
                  />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Count
                    label="Present"
                    value={dashboard.todayAttendance.Present}
                  />
                  <Count
                    label="Absent"
                    value={dashboard.todayAttendance.Absent}
                  />
                  <Count label="Late" value={dashboard.todayAttendance.Late} />
                  <Count
                    label="On leave"
                    value={dashboard.todayAttendance.Leave}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="font-bold">Class-wise attendance</h2>
                  <p className="text-sm text-(--text-muted)">
                    Attendance completion for today by class and section
                  </p>
                </div>
                {dashboard.classAttendance.length ? (
                  <div className="space-y-4">
                    {dashboard.classAttendance.map((item) => (
                      <div key={item.classId}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">
                            {item.className} · {item.section}
                          </span>
                          <span className="text-(--text-muted)">
                            {item.present +
                              item.absent +
                              item.late +
                              item.leave}
                            /{item.totalStudents} marked · {item.attendanceRate}
                            %
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-(--primary-soft-hover)/50">
                          <div
                            className="h-full rounded-full bg-(--primary)"
                            style={{ width: `${item.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No active classes have been added yet." />
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5 sm:p-6">
              <h2 className="font-bold">School-wide overview</h2>
              <p className="mt-1 text-sm text-(--text-muted)">
                Attendance percentage uses the total number of active students.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <SummaryTile
                  label="Students marked today"
                  value={dashboard.todayAttendance.marked}
                />
                <SummaryTile
                  label="Active class sections"
                  value={dashboard.classTotal}
                />
                <SummaryTile
                  label="Active staff accounts"
                  value={dashboard.staffTotal}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

const StatCard = ({ label, value, icon: Icon, detail }) => (
  <div className="rounded-2xl border border-(--border) bg-linear-125 from-(--card-gradient-1)/50 to-(--card-gradient-2)/10 p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-(--text-muted)">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value ?? 0}</p>
      </div>
      <span className="grid size-10 place-items-center rounded-xl bg-(--primary-soft)">
        <Icon size={20} className="text-(--primary)" />
      </span>
    </div>
    <p className="mt-4 text-xs text-(--text-muted)">{detail}</p>
  </div>
);

const Count = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-lg bg-(--primary-soft-hover) px-3 py-2">
    <span className="text-(--text-muted)">{label}</span>
    <strong>{value ?? 0}</strong>
  </div>
);

const SummaryTile = ({ label, value }) => (
  <div className="rounded-xl bg-(--primary-soft-hover) p-4">
    <p className="text-sm text-(--text-muted)">{label}</p>
    <p className="mt-1 text-2xl font-bold">{value ?? 0}</p>
  </div>
);

const FeeSummaryCard = ({ label, value, detail, warning = false }) => (
  <div className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-(--text-muted)">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </div>
      <span
        className={`grid size-10 place-items-center rounded-xl ${
          warning
            ? "bg-amber-500/10 text-amber-600"
            : "bg-(--primary-soft) text-(--primary)"
        }`}
      >
        <IndianRupee size={20} />
      </span>
    </div>
    <p className="mt-4 text-xs text-(--text-muted)">{detail}</p>
  </div>
);

const EmptyState = ({ message }) => (
  <p className="rounded-lg bg-(--primary-soft-hover) p-5 text-sm text-(--text-muted)">
    {message}
  </p>
);

export default AdminDashboard;
