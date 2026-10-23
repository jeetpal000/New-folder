import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardList, X } from "lucide-react";
import { api } from "../../services/api";
import { formatDate } from "../../utils/date";

const AdmissionApplications = () => {
  const [applications, setApplications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/admission-applications");
      setApplications(response.data.applications || []);
      setClasses(response.data.classes || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Admission applications could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "NexaManage | Admission applications";
    loadApplications();
  }, [loadApplications]);

  const review = async (event, applicationId, status) => {
    event.preventDefault();
    const formElement =
      event.currentTarget instanceof HTMLFormElement
        ? event.currentTarget
        : event.currentTarget.form;
    const form = formElement ? new FormData(formElement) : new FormData();
    setSavingId(applicationId);
    setError("");
    try {
      await api.patch(`/admin/admission-applications/${applicationId}`, {
        status,
        classId: form.get("classId"),
        admissionNumber: form.get("admissionNumber"),
        rollNumber: form.get("rollNumber"),
        reviewNote: form.get("reviewNote"),
      });
      await loadApplications();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Admission application could not be reviewed.",
      );
    } finally {
      setSavingId("");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 px-3 py-5 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-(--primary)">
          School administration
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
          <ClipboardList size={22} className="text-(--primary)" />
          Admission applications
        </h1>
        <p className="mt-1 text-sm text-(--text-muted)">
          Review public applications. Accepting an application creates a
          student record in the selected class.
        </p>
      </header>
      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="rounded-2xl border border-(--border) p-8 text-center text-sm text-(--text-muted)">
          Loading admission applications…
        </p>
      ) : applications.length ? (
        <section className="space-y-4">
          {applications.map((application) => (
            <article
              key={application._id}
              className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{application.applicantName}</h2>
                  <p className="mt-1 text-sm text-(--text-muted)">
                    Applying for {application.requestedClass} · Submitted{" "}
                    {formatDate(application.createdAt)}
                  </p>
                  <p className="mt-2 text-sm">
                    DOB {formatDate(application.dateOfBirth)}
                    {application.gender ? ` · ${application.gender}` : ""}
                  </p>
                  <p className="mt-1 text-sm">
                    Guardian: {application.guardianName} · {application.guardianPhone}
                  </p>
                  {application.email && (
                    <p className="mt-1 text-sm">{application.email}</p>
                  )}
                  {application.address && (
                    <p className="mt-1 text-sm text-(--text-muted)">
                      {application.address}
                    </p>
                  )}
                  {application.studentId && (
                    <p className="mt-2 text-sm text-emerald-700">
                      Enrolled as {application.studentId.admissionNumber} · roll{" "}
                      {application.studentId.rollNumber || "not assigned"}
                    </p>
                  )}
                  {application.reviewNote && (
                    <p className="mt-2 text-sm text-(--text-muted)">
                      Review note: {application.reviewNote}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    application.status === "Accepted"
                      ? "bg-emerald-500/10 text-emerald-700"
                      : application.status === "Rejected"
                        ? "bg-red-500/10 text-red-700"
                        : "bg-amber-500/10 text-amber-700"
                  }`}
                >
                  {application.status}
                </span>
              </div>
              {application.status === "Pending" && (
                <form
                  onSubmit={(event) =>
                    review(event, application._id, "Accepted")
                  }
                  className="mt-5 grid gap-3 border-t border-(--border) pt-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <label className="text-sm font-medium">
                    Enrol in class
                    <select
                      name="classId"
                      required
                      defaultValue=""
                      className="mt-1 w-full rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2"
                    >
                      <option value="" disabled>Select class</option>
                      {classes.map((schoolClass) => (
                        <option key={schoolClass._id} value={schoolClass._id}>
                          {schoolClass.name} · {schoolClass.section}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Admission number
                    <input
                      name="admissionNumber"
                      required
                      className="mt-1 w-full rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Roll number (optional)
                    <input
                      name="rollNumber"
                      className="mt-1 w-full rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Review note (optional)
                    <input
                      name="reviewNote"
                      className="mt-1 w-full rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                    <button
                      type="submit"
                      disabled={savingId === application._id || !classes.length}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <Check size={16} />
                      Accept & enrol
                    </button>
                    <button
                      type="button"
                      disabled={savingId === application._id}
                      onClick={(event) =>
                        review(event, application._id, "Rejected")
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-(--border) bg-(--glass-bg) p-8 text-center">
          <h2 className="font-semibold">No admission applications</h2>
          <p className="mt-1 text-sm text-(--text-muted)">
            New applications from the public school profile will appear here.
          </p>
        </div>
      )}
    </main>
  );
};

export default AdmissionApplications;
