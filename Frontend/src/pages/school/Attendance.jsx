import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  LogsIcon,
  Pencil,
  Printer,
  Search,
  Summary,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FloatingParticles from "../../components/FloatingParticles/FloatingPartcles";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import "./Attendance.css";
import { Input, Select } from "../../components/UI";

const STATUS_OPTIONS = [
  { value: "", label: "—", title: "Not marked" },
  { value: "Present", label: "P", title: "Present" },
  { value: "Absent", label: "A", title: "Absent" },
  { value: "Late", label: "L", title: "Late" },
  { value: "Leave", label: "Lv", title: "Leave" },
];

const dateKey = (studentId, date) => `${studentId}:${date}`;
const currentMonth = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (month) => {
  if (!month) return "";
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const AttendancePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = (user?.roleId?.role || user?.roleId?.name) === "Admin";
  const canMarkAttendance =
    isAdmin || user?.permissions?.includes("attendance.mark");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [days, setDays] = useState([]);
  const [records, setRecords] = useState({});
  const [dirtyRecords, setDirtyRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [todayMonth, setTodayMonth] = useState(currentMonth);
  const [monthLocked, setMonthLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lockingMonth, setLockingMonth] = useState(false);
  const [saved, setSaved] = useState(false);
  const [holidayEditorDate, setHolidayEditorDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [savingHoliday, setSavingHoliday] = useState(false);

  useEffect(() => {
    const refreshCurrentMonth = () => setTodayMonth(currentMonth());
    const intervalId = window.setInterval(refreshCurrentMonth, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    api
      .get("/get-classes")
      .then((response) => {
        const classList = response.data.classes || [];
        setClasses(classList);
        setSelectedClass((current) => current || classList[0]?._id || "");
      })
      .catch((error) =>
        setLoadError(
          error.response?.data?.message || "Could not load classes.",
        ),
      );
  }, []);

  const loadMonth = useCallback(async () => {
    if (!selectedClass) {
      setStudents([]);
      setDays([]);
      setRecords({});
      setDirtyRecords({});
      setMonthLocked(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const response = await api.get("/attendance/month", {
        params: { classId: selectedClass, month: selectedMonth },
      });
      const data = response.data;
      const nextRecords = Object.fromEntries(
        (data.records || []).map((record) => [
          dateKey(record.studentId, record.date),
          record.status,
        ]),
      );
      setStudents(data.students || []);
      setDays(data.days || []);
      setRecords(nextRecords);
      setMonthLocked(Boolean(data.locked));
      setDirtyRecords({});
      setSaved(false);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Could not load monthly attendance.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedMonth]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.rollNo.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query),
    );
  }, [students, search]);

  const summary = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    const holidays = new Set(
      days.filter((day) => day.holiday).map((day) => day.date),
    );
    Object.entries(records).forEach(([key, status]) => {
      const date = key.slice(key.indexOf(":") + 1);
      if (status in counts && !holidays.has(date)) counts[status] += 1;
    });
    const marked = Object.entries(records).filter(([key, status]) => {
      const date = key.slice(key.indexOf(":") + 1);
      return status && !holidays.has(date);
    }).length;
    return {
      total: students.length,
      ...counts,
      percentage: marked
        ? Math.round(((counts.Present + counts.Late) / marked) * 100)
        : 0,
    };
  }, [days, records, students.length]);

  const selectedClassRecord = classes.find(
    (schoolClass) => schoolClass._id === selectedClass,
  );
  const selectedClassLabel = selectedClassRecord
    ? `${selectedClassRecord.name} - ${selectedClassRecord.section}`
    : "No class selected";
  const maxSelectableMonth = todayMonth;
  const isCurrentSelectedMonth = selectedMonth === maxSelectableMonth;
  const isPastSelectedMonth = selectedMonth < maxSelectableMonth;
  const canEditSelectedMonth =
    canMarkAttendance && isCurrentSelectedMonth && !monthLocked && !loading;

  const updateStatus = (studentId, date, status) => {
    if (!canEditSelectedMonth) return;
    const key = dateKey(studentId, date);
    setRecords((current) => ({ ...current, [key]: status }));
    setDirtyRecords((current) => ({ ...current, [key]: status }));
    setSaved(false);
  };

  const saveAttendance = async () => {
    if (!canEditSelectedMonth || saving) return;
    const holidayDates = new Set(
      days.filter((day) => day.holiday).map((day) => day.date),
    );
    const changedRecords = Object.entries(dirtyRecords)
      .map(([key, status]) => {
        const separator = key.indexOf(":");
        return {
          studentId: key.slice(0, separator),
          date: key.slice(separator + 1),
          status,
        };
      })
      .filter((record) => !holidayDates.has(record.date));
    setSaving(true);
    setLoadError("");
    try {
      if (changedRecords.length) {
        await api.post("/attendance/month", {
          classId: selectedClass,
          month: selectedMonth,
          records: changedRecords,
        });
      }
      setDirtyRecords({});
      setSaved(true);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Could not save monthly attendance.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openHolidayEditor = (day) => {
    if (!canEditSelectedMonth) return;
    setHolidayEditorDate(day.date);
    setHolidayName(day.holiday?.name || "");
    setLoadError("");
  };

  const saveHoliday = async () => {
    if (!holidayEditorDate || !canEditSelectedMonth || savingHoliday) return;
    setSavingHoliday(true);
    setLoadError("");
    try {
      await api.put("/attendance/holiday", {
        classId: selectedClass,
        date: holidayEditorDate,
        name: holidayName,
      });
      setDays((current) =>
        current.map((day) =>
          day.date === holidayEditorDate
            ? {
                ...day,
                holiday: holidayName.trim()
                  ? { id: day.holiday?.id, name: holidayName.trim() }
                  : null,
              }
            : day,
        ),
      );
      setHolidayEditorDate("");
      setHolidayName("");
      setSaved(false);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Could not save this holiday.",
      );
    } finally {
      setSavingHoliday(false);
    }
  };

  const dayCounts = useMemo(() => {
    return Object.fromEntries(
      days.map((day) => {
        const counts = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
        students.forEach((student) => {
          const status = records[dateKey(student.id, day.date)];
          if (status && status in counts) counts[status] += 1;
        });
        return [day.date, counts];
      }),
    );
  }, [days, records, students]);

  const printStats = useMemo(() => {
    const statusTotals = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    const studentTotals = Object.fromEntries(
      students.map((student) => [
        student.id,
        { Present: 0, Absent: 0, Late: 0, Leave: 0, Holiday: 0 },
      ]),
    );
    const now = new Date();
    const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    const currentMonthValue = today.slice(0, 7);
    const completionDayDates = new Set(
      days
        .filter(
          (day) =>
            !day.holiday &&
            (selectedMonth < currentMonthValue ||
              (selectedMonth === currentMonthValue && day.date <= today)),
        )
        .map((day) => day.date),
    );
    let markedRecords = 0;

    students.forEach((student) => {
      days.forEach((day) => {
        const total = studentTotals[student.id];
        if (day.holiday) {
          total.Holiday += 1;
          return;
        }
        const status = records[dateKey(student.id, day.date)];
        if (status && status in statusTotals) {
          total[status] += 1;
          statusTotals[status] += 1;
          if (completionDayDates.has(day.date)) markedRecords += 1;
        }
      });
    });

    const totalMarked = Object.values(statusTotals).reduce(
      (total, count) => total + count,
      0,
    );
    return {
      statusTotals,
      studentTotals,
      attendancePercentage: totalMarked
        ? Math.round(
            ((statusTotals.Present + statusTotals.Late) / totalMarked) * 100,
          )
        : 0,
      completionPercentage:
        students.length && completionDayDates.size
          ? Math.round(
              (markedRecords / (students.length * completionDayDates.size)) *
                100,
            )
          : 0,
    };
  }, [days, records, selectedMonth, students]);

  const shiftMonth = (offset) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextMonth = new Date(year, month - 1 + offset, 1);
    const nextMonthValue = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
    if (nextMonthValue > maxSelectableMonth) return;
    setSelectedMonth(nextMonthValue);
    setHolidayEditorDate("");
  };

  const lockMonthAndOpenCurrent = async () => {
    if (
      !canMarkAttendance ||
      !isPastSelectedMonth ||
      monthLocked ||
      lockingMonth
    ) {
      return;
    }
    setLockingMonth(true);
    setLoadError("");
    try {
      await api.post("/attendance/month/lock", {
        classId: selectedClass,
        month: selectedMonth,
      });
      setMonthLocked(true);
      setSelectedMonth(maxSelectableMonth);
      setHolidayEditorDate("");
    } catch (error) {
      setLoadError(
        error.response?.data?.message ||
          "Could not lock this attendance month.",
      );
    } finally {
      setLockingMonth(false);
    }
  };

  const printRegister = () => {
    window.print();
  };

  return (
    <main className="attendance-page relative min-h-full overflow-hidden">
      <FloatingParticles />
      <div className="relative z-10 mx-auto max-w-[1600px] space-y-5 p-3 sm:p-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--border) text-(--text-muted) transition hover:text-(--primary)"
            >
              <ArrowLeft size={19} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-(--text)">
                  Attendance Register
                </h1>
                <span className="rounded-full bg-(--primary)/10 px-3 py-1 text-xs font-semibold text-(--primary)">
                  {selectedClassLabel}
                </span>
              </div>
              <p className="mt-1 text-sm text-(--text-muted)">
                Monthly class sheet · {monthLabel(selectedMonth)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={printRegister}
              disabled={loading || !students.length}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-(--primary) bg-(--primary-soft) px-4 text-sm font-semibold text-(--text) transition hover:border-(--primary) hover:text-(--primary) disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={17} />
              Print month
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 size={16} />
                Saved
              </span>
            )}
            {isPastSelectedMonth && canMarkAttendance && !monthLocked && (
              <button
                type="button"
                onClick={lockMonthAndOpenCurrent}
                disabled={lockingMonth || loading}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-500/20 disabled:opacity-50"
              >
                <Lock size={16} />
                {lockingMonth ? "Locking..." : "Lock month & open current"}
              </button>
            )}
            {isPastSelectedMonth && monthLocked && (
              <span className="flex h-10 items-center gap-2 rounded-xl bg-slate-200 px-3 text-sm font-semibold text-slate-700">
                <Lock size={15} />
                Month locked · View only
              </span>
            )}
            {canEditSelectedMonth && (
              <button
                type="button"
                onClick={saveAttendance}
                disabled={
                  saving || loading || !Object.keys(dirtyRecords).length
                }
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Check size={17} /> Save changes
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-3 rounded-2xl border border-(--border) bg-(--primary-soft)/50 backdrop-blur-2xl p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)]">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              Month
            </span>
            <span className="flex h-11 items-center gap-1 rounded-xl border border-(--border) bg-(--primary-soft) p-1 hover:">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                title="Previous month"
                className="flex h-9 w-9 p-1  shrink-0 items-center justify-center rounded-md border border-(--border) text-(--primary) bg-(--primary-soft-hover) hover:bg-(--primary)/50 hover:text-(--primary)"
              >
                <ChevronLeft size={19} />
              </button>
              <span className="relative min-w-0 flex-1">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-(--primary)"
                />
                <Input
                  type="month"
                  value={selectedMonth}
                  max={maxSelectableMonth}
                  onChange={(event) => {
                    if (event.target.value > maxSelectableMonth) {
                      setLoadError(
                        "Future attendance months are not available.",
                      );
                      return;
                    }
                    setLoadError("");
                    setSelectedMonth(event.target.value);
                    setHolidayEditorDate("");
                  }}
                  className="h-9 w-full min-w-0 bg-transparent pl-7 pr-1 text-sm text-(--text)"
                />
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={selectedMonth >= maxSelectableMonth}
                aria-label="Next month"
                title="Next month"
                className="flex h-9 w-9 p-1  shrink-0 items-center justify-center rounded-md border border-(--border) text-(--primary) bg-(--primary-soft-hover) hover:bg-(--primary)/50 hover:text-(--primary) disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={19} />
              </button>
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              Class / Section
            </span>
            <span className="relative block">
              <Select
                value={selectedClass}
                onChange={(event) => {
                  setSelectedClass(event.target.value);
                  setHolidayEditorDate("");
                }}
                className="h-11 w-full appearance-none rounded-xl border border-(--border) bg() px-3 pr-10 text-sm text-(--text)"
              >
                {classes.map((schoolClass) => (
                  <option key={schoolClass._id} value={schoolClass._id}>
                    {schoolClass.name} - {schoolClass.section}
                  </option>
                ))}
              </Select>
              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              Find student
            </span>
            <span className="relative block">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or roll number"
                className="h-11 w-full rounded-xl border border-(--border) pl-10 pr-3 text-sm text-(--text)"
              />
            </span>
          </label>
        </section>

        {loadError && (
          <p
            role="alert"
            className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700"
          >
            {loadError}
          </p>
        )}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            label="Students"
            value={summary.total}
            icon={
              <Users
                size={28}
                className="text-(--primary) p-1 bg-black/10 rounded-full"
              />
            }
          />
          <SummaryCard
            label="Present"
            value={summary.Present}
            status="Present"
            icon={
              <CheckCircle2
                size={28}
                className="text-(--success) p-1 bg-black/10 rounded-full"
              />
            }
          />
          <SummaryCard
            label="Absent"
            value={summary.Absent}
            status="Absent"
            icon={
              <X
                size={28}
                className="text-(--danger) bg-black/10 p-1 rounded-full"
              />
            }
          />
          <SummaryCard
            label="Late"
            value={summary.Late}
            status="Late"
            icon={
              <Clock3
                size={28}
                className="text-(--info) bg-black/10 p-1 rounded-full"
              />
            }
          />
          <SummaryCard
            label="Leave"
            value={summary.Leave}
            status="Leave"
            icon={
              <LogsIcon
                size={28}
                className="text-(--warning) bg-black/10 p-1 rounded-full"
              />
            }
          />
          <SummaryCard
            label="Attendance"
            value={`${summary.percentage}%`}
            icon={
              <Summary
                size={28}
                className="text-(--Primary) bg-black/10 p-1 rounded-full"
              />
            }
          />
        </section>

        {holidayEditorDate && canEditSelectedMonth && (
          <section className="flex flex-col gap-3 rounded-2xl border border-(--primary) bg-(--primary-soft)/50 backdrop-blur-2xl p-4 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-sm font-semibold text-(--text)">
                Holiday for{" "}
                {new Date(`${holidayEditorDate}T00:00:00`).toLocaleDateString(
                  "en-IN",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  },
                )}
              </span>
              <Input
                autoFocus
                maxLength={100}
                value={holidayName}
                onChange={(event) => setHolidayName(event.target.value)}
                placeholder="Holiday name (e.g. Sunday, Diwali)"
                className="h-10 w-full rounded-lg border border-(--border)  px-3 text-sm text-(--text)"
              />
              <span className="mt-1 block text-xs text-(--text-muted)">
                Save a name to mark this date as a holiday; clear the name to
                remove it.
              </span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveHoliday}
                disabled={savingHoliday}
                className="h-10 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingHoliday ? "Saving..." : "Save holiday"}
              </button>
              <button
                type="button"
                onClick={() => setHolidayEditorDate("")}
                className="h-10 rounded-lg border border-(--border) px-4 text-sm font-semibold text-(--text)"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-(--border) bg-(--primary-soft) shadow-sm">
          <div className="flex flex-col gap-2 border-b border-(--border) px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-(--text)">
                {monthLabel(selectedMonth)} register
              </h2>
              <p className="text-xs text-(--text-muted)">
                {isPastSelectedMonth
                  ? `Past month${monthLocked ? " · locked" : ""} — view only.`
                  : monthLocked
                    ? "This month is locked and can only be viewed."
                    : "Choose a mark in each date cell. Approved leave is filled automatically and can be changed."}
              </p>
            </div>
            <StatusLegend />
          </div>
          {loading ? (
            <p className="p-8 text-center text-sm text-(--text-muted)">
              Loading monthly attendance...
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
                <thead className="sticky top-0 z-30">
                  <tr>
                    <th className="sticky left-0 z-40 w-12 min-w-12 border-b border-r bg-(--primary-soft-hover)/50 backdrop-blur-2xl border-(--border) bg-(--) px-2 py-2 text-center text-xs font-bold text-(--text-muted)">
                      S.No.
                    </th>
                    <th className="sticky left-12 z-40 w-52 min-w-52 border-b border-r bg-(--primary-soft-hover)/50 backdrop-blur-2xl border-(--border)  px-3 py-2 text-left text-xs font-bold uppercase text-(--text-muted)">
                      Student name
                    </th>
                    <th className="sticky left-52 z-40 w-20 min-w-20 border-b border-r-2 shadow-2xl border-(--border) bg-(--primary-soft-hover)/50  backdrop-blur-2xl  px-2 py-2 text-center text-xs font-bold uppercase text-(--text-muted)">
                      Roll no.
                    </th>
                    {days.map((day) => (
                      <th
                        key={day.date}
                        className={`w-16 min-w-16 border-b border-r border-(--border) px-1 py-1 text-center ${
                          day.holiday
                            ? "bg-amber-100 text-amber-900"
                            : day.isSunday
                              ? "bg-rose-50 text-rose-700"
                              : " text-(--text-muted)"
                        }`}
                      >
                        <div className="text-[10px] font-medium uppercase">
                          {new Date(`${day.date}T00:00:00`).toLocaleDateString(
                            "en-IN",
                            { weekday: "short" },
                          )}
                        </div>
                        <div className="text-sm font-bold">{day.day}</div>
                        {canEditSelectedMonth ? (
                          <button
                            type="button"
                            title={
                              day.holiday
                                ? `Edit ${day.holiday.name}`
                                : "Mark as holiday"
                            }
                            onClick={() => openHolidayEditor(day)}
                            className="mx-auto flex max-w-14 items-center justify-center gap-0.5 truncate text-[9px] font-medium underline decoration-dotted"
                          >
                            {day.holiday ? (
                              day.holiday.name
                            ) : (
                              <>
                                <Pencil size={9} />
                                Holiday
                              </>
                            )}
                          </button>
                        ) : (
                          day.holiday && (
                            <div className="max-w-14 truncate text-[9px] font-semibold">
                              {day.holiday.name}
                            </div>
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={days.length + 3}
                        className="px-6 py-16 text-center text-sm text-(--text-muted)"
                      >
                        {students.length
                          ? "No students match your search."
                          : "No students found in this class."}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <tr key={student.id} className="group">
                        <td className="sticky left-0 z-20 border-b border-r border-(--border)  px-2 py-1 text-center text-xs text-(--text-muted) bg-(--primary-soft-hover)/50 backdrop-blur-2xl">
                          {index + 1}
                        </td>
                        <td className="sticky left-12 z-20 max-w-52 border-b border-r border-(--border) bg-(--primary-soft-hover)/50 backdrop-blur-2xl px-3 py-1.5 font-medium text-(--text) ">
                          <span className="block truncate" title={student.name}>
                            {student.name}
                          </span>
                        </td>
                        <td className="sticky left-52 z-20 border-b border-r-2 border-(--border) bg-(--primary-soft-hover)/50 shadow-2xl backdrop-blur-2xl px-2 py-1.5 text-center text-xs text-(--text-muted)">
                          {student.rollNo}
                        </td>
                        {days.map((day) => {
                          const status =
                            records[dateKey(student.id, day.date)] || "";
                          const option = STATUS_OPTIONS.find(
                            (item) => item.value === status,
                          );
                          return (
                            <td
                              key={day.date}
                              className={`border-b border-r border-(--border) p-1 text-center ${
                                day.holiday
                                  ? "bg-amber-50"
                                  : day.isSunday
                                    ? "bg-rose-50/60"
                                    : "bg-(--)"
                              }`}
                            >
                              {day.holiday ? (
                                <span
                                  title={day.holiday.name}
                                  className="inline-block max-w-14 truncate text-[10px] font-semibold text-amber-800"
                                >
                                  H
                                </span>
                              ) : (
                                <select
                                  aria-label={`${student.name}, ${day.date} attendance`}
                                  value={status}
                                  disabled={!canEditSelectedMonth}
                                  onChange={(event) =>
                                    updateStatus(
                                      student.id,
                                      day.date,
                                      event.target.value,
                                    )
                                  }
                                  title={option?.title || "Not marked"}
                                  className={`h-8 w-12 cursor-pointer rounded-md border border-transparent text-center text-xs font-bold outline-none focus:border-(--primary) disabled:cursor-default ${statusClass(
                                    status,
                                  )}`}
                                >
                                  {STATUS_OPTIONS.map((item) => (
                                    <option
                                      key={item.value || "blank"}
                                      value={item.value}
                                      title={item.title}
                                    >
                                      {item.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredStudents.length > 0 && (
                  <tfoot>
                    <tr>
                      <td className="sticky bottom-0 left-0 z-20 border-r border-t-2 border-(--border) bg-(--primary-soft-hover)/50 backdrop-blur-2xl" />
                      <td className="sticky bottom-0 left-12 z-20 border-r border-t-2 bg-(--primary-soft-hover)/50 backdrop-blur-2xl border-(--border) bg px-3 py-2 text-xs font-bold text-(--text)">
                        Daily total
                      </td>
                      <td className="sticky bottom-0 left-52 z-20 border-r-2 border-t-2 border-(--border) shadow-2xl bg-(--primary-soft-hover)/50 backdrop-blur-2xl" />
                      {days.map((day) => (
                        <td
                          key={day.date}
                          title={day.holiday?.name || ""}
                          className={`sticky bottom-0 border-r border-t-2 border-(--border) px-1 py-1 text-center text-[9px] font-semibold ${
                            day.holiday
                              ? "bg-amber-100 text-amber-900"
                              : "bg-() text-(--text-muted)"
                          }`}
                        >
                          {day.holiday
                            ? "HOLIDAY"
                            : `${dayCounts[day.date]?.Present || 0} P`}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
          <footer className="flex flex-col gap-1 border-t border-(--border) px-4 py-3 text-xs text-(--text-muted) sm:flex-row sm:justify-between">
            <span>
              Showing {filteredStudents.length} of {students.length} students
              {Object.keys(dirtyRecords).length > 0 &&
                " · Unsaved attendance changes"}
            </span>
            <span>
              {selectedClassLabel} · {monthLabel(selectedMonth)}
            </span>
          </footer>
        </section>
      </div>

      {/* Printing Sheet  */}
      <section className="attendance-print" aria-hidden="true">
        <header className="attendance-print-header">
          <h1>Monthly Attendance Register</h1>
          <div className="attendance-print-meta">
            <span>
              <strong>Month:</strong> {monthLabel(selectedMonth)}
            </span>
            <span>
              <strong>Class:</strong> {selectedClassLabel}
            </span>
            <span>
              <strong>Students:</strong> {students.length}
            </span>
          </div>
          <div className="attendance-print-summary">
            <span>
              <strong>Present:</strong> {printStats.statusTotals.Present}
            </span>
            <span>
              <strong>Absent:</strong> {printStats.statusTotals.Absent}
            </span>
            <span>
              <strong>Late:</strong> {printStats.statusTotals.Late}
            </span>
            <span>
              <strong>Leave:</strong> {printStats.statusTotals.Leave}
            </span>
            <span>
              <strong>Overall attendance:</strong>{" "}
              {printStats.attendancePercentage}%
            </span>
            <span>
              <strong>Register complete:</strong>{" "}
              {printStats.completionPercentage}%
            </span>
          </div>
          <p className="attendance-print-legend">
            P = Present · A = Absent · L = Late · Lv = Leave · H = Holiday
          </p>
        </header>
        <table className="attendance-print-table">
          <thead>
            <tr>
              <th rowSpan={2}>S.No.</th>
              <th rowSpan={2}>Student name</th>
              <th rowSpan={2}>Roll no.</th>
              {days.map((day) => (
                <th
                  key={day.date}
                  className={day.holiday ? "attendance-print-holiday" : ""}
                  title={day.holiday?.name || ""}
                >
                  {day.day}
                  {day.holiday && <small>{day.holiday.name}</small>}
                </th>
              ))}
              <th colSpan={5}>Monthly total</th>
            </tr>
            <tr>
              {days.map((day) => (
                <th
                  key={day.date}
                  className={day.holiday ? "attendance-print-holiday" : ""}
                >
                  {day.holiday
                    ? "H"
                    : new Date(`${day.date}T00:00:00`).toLocaleDateString(
                        "en-IN",
                        {
                          weekday: "short",
                        },
                      )}
                </th>
              ))}
              <th>P</th>
              <th>A</th>
              <th>L</th>
              <th>Lv</th>
              <th>H</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const totals = printStats.studentTotals[student.id];
              return (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td className="attendance-print-name">{student.name}</td>
                  <td>{student.rollNo}</td>
                  {days.map((day) => {
                    const status = records[dateKey(student.id, day.date)];
                    return (
                      <td
                        key={day.date}
                        className={
                          day.holiday ? "attendance-print-holiday" : ""
                        }
                      >
                        {day.holiday
                          ? "H"
                          : STATUS_OPTIONS.find(
                              (option) => option.value === status,
                            )?.label || ""}
                      </td>
                    );
                  })}
                  <td>{totals.Present}</td>
                  <td>{totals.Absent}</td>
                  <td>{totals.Late}</td>
                  <td>{totals.Leave}</td>
                  <td>{totals.Holiday}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Daily present</td>
              {days.map((day) => (
                <td
                  key={day.date}
                  className={day.holiday ? "attendance-print-holiday" : ""}
                >
                  {day.holiday ? "H" : dayCounts[day.date]?.Present || 0}
                </td>
              ))}
              <td colSpan={5}>
                Attendance rate: {printStats.attendancePercentage}% · Register
                complete: {printStats.completionPercentage}%
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </main>
  );
};

const statusClass = (status) => {
  switch (status) {
    case "Present":
      return "bg-emerald-100 text-emerald-800";
    case "Absent":
      return "bg-red-100 text-red-800";
    case "Late":
      return "bg-sky-100 text-sky-800";
    case "Leave":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-(--primary-soft) text-(--text-muted)";
  }
};

const SummaryCard = ({ label, value, icon, status }) => (
  <div className="rounded-xl border border-(--border) bg-linear-to-br from-(--card-gradient-1)/30 via-(--card-gradient-2) to-(--card-gradient-1)/50 p-3">
    <div className="flex items-start  gap-2">
      {icon || (
        <span className={`h-2.5 w-2.5 rounded-full ${statusClass(status)}`} />
      )}
      <span className="truncate text-xs font-medium text-(--text-muted)">
        {label}
      </span>
    </div>
    <p className="mt-1 ml-7 text-xl font-bold text-(--text)">{value}</p>
  </div>
);

const StatusLegend = () => (
  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
    {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
      <span
        key={option.value}
        className={`rounded px-1.5 py-0.5 ${statusClass(option.value)}`}
      >
        {option.label} = {option.title}
      </span>
    ))}
    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
      H = Holiday
    </span>
  </div>
);

export default AttendancePage;
