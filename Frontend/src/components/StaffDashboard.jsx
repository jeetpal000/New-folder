import { useCallback, useEffect, useState } from "react";
import { Activity, CalendarCheck2, GraduationCap, Users } from "lucide-react";
import { api } from "../services/api";
import SchoolIdentityCarousel from "./SchoolIdentityCarousel";
import { useAuthStore } from "../store/authStore";

const StaffDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const response = await api.get("/dashboard/staff");
      setDashboard(response.data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Staff dashboard data could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    document.title = "NexaManage | Staff Dashboard";
    loadDashboard();
  }, [loadDashboard]);

  return (
    <main className="min-h-screen bg-(--primary-soft-hover) px-3 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <SchoolIdentityCarousel />
        <header className="overflow-hidden rounded-3xl bg-linear-125 from-(--primary) to-indigo-700 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
            Staff workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {user?.name || "Staff"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Your quick view of student strength and today{"’"}s class
            attendance.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm">
            <CalendarCheck2 size={17} />
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
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
          <div className="rounded-2xl border border-(--border) bg-(--glass-bg) p-8 text-center text-(--text-muted)">
            Loading your overview…
          </div>
        )}

        {dashboard && (
          <>
            <section className="grid gap-4 sm:grid-cols-2">
              <StaffMetric
                label="Total students"
                value={dashboard.studentTotal}
                icon={GraduationCap}
                helper="Across active classes"
              />
              <StaffMetric
                label="Attendance today"
                value={`${dashboard.todayAttendance.rate}%`}
                icon={Activity}
                helper={`${dashboard.todayAttendance.marked} attendance records`}
              />
            </section>

            <section className="rounded-3xl border border-(--border) bg-linear-125 from-(--card-gradient-1)/50 to-(--card-gradient-2)/10 p-5 sm:p-7">
              <div className="mb-6 flex items-start gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-(--primary-soft)">
                  <Users size={21} className="text-(--primary)" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">Class-wise attendance</h2>
                  <p className="mt-1 text-sm text-(--text-muted)">
                    Today’s attendance submitted for each class section
                  </p>
                </div>
              </div>

              {dashboard.classAttendance.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {dashboard.classAttendance.map((item) => (
                    <article
                      key={item.classId}
                      className="rounded-2xl border border-(--border) p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {item.className}-{item.section}
                          </p>
                          <p className="mt-1 text-xs text-(--text-muted)">
                            {item.totalStudents} students
                          </p>
                        </div>
                        <strong className="text-xl text-(--primary)">
                          {item.attendanceRate}%
                        </strong>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-(--primary-soft)">
                        <div
                          className="h-full rounded-full bg-(--primary)"
                          style={{ width: `${item.attendanceRate}%` }}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--text-muted)">
                        <span>Present: {item.present}</span>
                        <span>Absent: {item.absent}</span>
                        <span>Late: {item.late}</span>
                        <span>Leave: {item.leave}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-(--primary-soft-hover) p-5 text-sm text-(--text-muted)">
                  No active classes have been added yet.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

const StaffMetric = ({ label, value, icon: Icon, helper }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-(--border) bg-linear-125 from-(--card-gradient-1)/50 to-(--card-gradient-2)/10 p-5 shadow-sm sm:p-6">
    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-(--primary-soft)">
      <Icon size={22} className="text-(--primary)" />
    </span>
    <div>
      <p className="text-sm text-(--text-muted)">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value ?? 0}</p>
      <p className="mt-1 text-xs text-(--text-muted)">{helper}</p>
    </div>
  </div>
);

export default StaffDashboard;
