import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardCheck, Save, X } from "lucide-react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { formatDate } from "../../utils/date";

const LeaveApprovals = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = (user?.roleId?.role || user?.roleId?.name) === "Admin";
  const [requests, setRequests] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherByClass, setTeacherByClass] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [savingClassId, setSavingClassId] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [requestResponse, assignmentResponse] = await Promise.all([
        api.get("/leave-requests"),
        isAdmin ? api.get("/admin/class-teacher-assignments") : null,
      ]);
      setRequests(requestResponse.data.requests || []);
      if (assignmentResponse) {
        setClasses(assignmentResponse.data.classes || []);
        setTeachers(assignmentResponse.data.teachers || []);
        setTeacherByClass(
          Object.fromEntries(
            (assignmentResponse.data.classes || []).map((schoolClass) => [
              schoolClass._id,
              schoolClass.classTeacherId?.[0]?._id || "",
            ]),
          ),
        );
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Leave requests could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    document.title = "NexaManage | Leave approvals";
    loadRequests();
  }, [loadRequests]);

  const review = async (requestId, status) => {
    setSavingId(requestId);
    setError("");
    try {
      await api.patch(`/leave-requests/${requestId}`, { status });
      await loadRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Leave request could not be updated.",
      );
    } finally {
      setSavingId("");
    }
  };

  const saveClassTeacher = async (classId) => {
    setSavingClassId(classId);
    setError("");
    try {
      await api.put(`/admin/classes/${classId}/class-teacher`, {
        teacherId: teacherByClass[classId] || null,
      });
      await loadRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Class teacher assignment could not be saved.",
      );
    } finally {
      setSavingClassId("");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 px-3 py-5 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-(--primary)">
          Student services
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
          <ClipboardCheck size={22} className="text-(--primary)" />
          Leave approvals
        </h1>
        <p className="mt-1 text-sm text-(--text-muted)">
          Class teachers can review requests for students in their assigned
          classes. School admins can review requests across the school.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {isAdmin && (
        <section className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5">
          <h2 className="font-bold">Assign class teachers</h2>
          <p className="mt-1 text-sm text-(--text-muted)">
            Class teachers can review requests for students in their assigned
            classes. School admins can review requests across the school.
          </p>
          {classes.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {classes.map((schoolClass) => (
                <div
                  key={schoolClass._id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-(--border) p-3"
                >
                  <span className="min-w-32 flex-1 text-sm font-semibold">
                    {schoolClass.name} · {schoolClass.section}
                  </span>
                  <select
                    value={teacherByClass[schoolClass._id] || ""}
                    onChange={(event) =>
                      setTeacherByClass((current) => ({
                        ...current,
                        [schoolClass._id]: event.target.value,
                      }))
                    }
                    className="min-w-48 flex-1 rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.userId?.name || teacher.employeeId}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={savingClassId === schoolClass._id}
                    onClick={() => saveClassTeacher(schoolClass._id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-(--primary) px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Save size={14} />
                    Save
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-(--text-muted)">
              Create active classes and teacher accounts to assign class
              teachers.
            </p>
          )}
        </section>
      )}
      {loading ? (
        <p className="rounded-2xl border border-(--border) p-8 text-center text-sm text-(--text-muted)">
          Loading leave requests…
        </p>
      ) : requests.length ? (
        <section className="space-y-3">
          {requests.map((request) => (
            <article
              key={request._id}
              className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-bold">
                    {request.studentId?.name || "Student"}
                  </h2>
                  <p className="mt-1 text-sm text-(--text-muted)">
                    {request.classId?.name} · Section {request.classId?.section}{" "}
                    · Roll{" "}
                    {request.studentId?.rollNumber ||
                      request.studentId?.admissionNumber}
                  </p>
                  <p className="mt-3 text-sm">
                    {formatDate(request.fromDate)} – {formatDate(request.toDate)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {request.reason}
                  </p>
                  <p className="mt-2 text-xs text-(--text-muted)">
                    Guardian contact: {request.guardianPhone}
                  </p>
                  {request.reviewNote && (
                    <p className="mt-2 text-sm text-(--text-muted)">
                      Note: {request.reviewNote}
                    </p>
                  )}
                  {request.reviewedBy?.name && (
                    <p className="mt-1 text-xs text-(--text-muted)">
                      Reviewed by {request.reviewedBy.name}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      request.status === "Approved"
                        ? "bg-emerald-500/10 text-emerald-700"
                        : request.status === "Rejected"
                          ? "bg-red-500/10 text-red-700"
                          : "bg-amber-500/10 text-amber-700"
                    }`}
                  >
                    {request.status}
                  </span>
                  {request.status === "Pending" && (
                    <>
                      <button
                        type="button"
                        disabled={savingId === request._id}
                        onClick={() => review(request._id, "Approved")}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        <Check size={15} />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={savingId === request._id}
                        onClick={() => review(request._id, "Rejected")}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                      >
                        <X size={15} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-(--border) bg-(--glass-bg) p-8 text-center">
          <h2 className="font-semibold">No leave requests to review</h2>
          <p className="mt-1 text-sm text-(--text-muted)">
            Staff and teachers can review requests for students in their
            assigned classes. School admins can review requests across the
            school.
          </p>
        </div>
      )}
    </main>
  );
};

export default LeaveApprovals;
