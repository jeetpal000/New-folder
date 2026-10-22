import { useCallback, useEffect, useState } from "react";
import { BookOpen, Check, ClipboardList, Plus, Send, X } from "lucide-react";
import { Input, Select } from "../../components/UI";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const assessmentTypes = ["Quiz", "Unit Test", "Mid Term", "Final", "Other"];

const getLocalDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const Assessments = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = (user?.roleId?.role || user?.roleId?.name) === "Admin";
  const permissions = user?.permissions || [];
  const canCreate = isAdmin || permissions.includes("assessment.create");
  const canMark = isAdmin || permissions.includes("assessment.mark");
  const canPublish = isAdmin || permissions.includes("assessment.publish");
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [formClass, setFormClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [classResponse, assessmentResponse] = await Promise.all([
        api.get("/get-classes"),
        api.get("/assessments"),
      ]);
      setClasses(classResponse.data.classes || []);
      setAssessments(assessmentResponse.data.assessments || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Assessments could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "NexaManage | Assessments";
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    let cancelled = false;
    const loadSubjects = async () => {
      setSubjects([]);
      if (!formClass) return;
      try {
        const response = await api.get("/get-subject", {
          params: { classId: formClass },
        });
        if (!cancelled) setSubjects(response.data.getSubject || []);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Subjects for the selected class could not be loaded.",
          );
        }
      }
    };
    loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [formClass]);

  const filteredAssessments =
    selectedClass === "All"
      ? assessments
      : assessments.filter(
          (assessment) => String(assessment.classId?._id) === selectedClass,
        );

  const openResults = async (assessment) => {
    setActiveAssessment(assessment);
    setLoadingResults(true);
    setError("");
    try {
      const response = await api.get(
        `/assessments/${assessment._id}/results`,
      );
      setStudents(response.data.students || []);
      setMarks(
        Object.fromEntries(
          (response.data.students || []).map((student) => [
            student._id,
            {
              marks: student.result?.marks ?? "",
              isAbsent: student.result?.isAbsent ?? false,
              remark: student.result?.remark ?? "",
            },
          ]),
        ),
      );
      setActiveAssessment(response.data.assessment);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Assessment results could not be loaded.",
      );
      setActiveAssessment(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const createAssessment = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/assessments", {
        title: form.get("title"),
        type: form.get("type"),
        classId: form.get("classId"),
        subjectId: form.get("subjectId"),
        academicSession: form.get("academicSession"),
        scheduledAt: form.get("scheduledAt"),
        maxMarks: Number(form.get("maxMarks")),
        passMarks: Number(form.get("passMarks")),
      });
      setShowCreate(false);
      setFormClass("");
      setNotice("Assessment created.");
      await loadPage();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Assessment could not be created.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveResults = async () => {
    const incompleteStudent = students.find((student) => {
      const result = marks[student._id] || {};
      return !result.isAbsent && result.marks === "";
    });
    if (incompleteStudent) {
      setError(`Enter marks or mark ${incompleteStudent.name} as absent.`);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.put(`/assessments/${activeAssessment._id}/results`, {
        results: students.map((student) => {
          const result = marks[student._id] || {};
          return {
            studentId: student._id,
            isAbsent: result.isAbsent || false,
            marks: result.isAbsent ? null : Number(result.marks),
            remark: result.remark || "",
          };
        }),
      });
      setNotice("Draft results saved.");
      await openResults(activeAssessment);
      await loadPage();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Results could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const publishResults = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post(`/assessments/${activeAssessment._id}/publish`);
      setNotice("Results published successfully.");
      setActiveAssessment(null);
      await loadPage();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Results could not be published.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-3 py-5 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-(--border) pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-(--primary)">
            Academics
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <BookOpen size={22} className="text-(--primary)" />
            Assessments & results
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            Schedule class assessments, enter marks and publish results.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
              setFormClass("");
              setSubjects([]);
              setShowCreate(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            New assessment
          </button>
        )}
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700"
        >
          {notice}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-(--text-muted)">
          {filteredAssessments.length} assessment
          {filteredAssessments.length === 1 ? "" : "s"}
        </p>
        <Select
          value={selectedClass}
          onChange={(event) => setSelectedClass(event.target.value)}
          className="w-full max-w-xs"
        >
          <option value="All">All accessible classes</option>
          {classes.map((schoolClass) => (
            <option key={schoolClass._id} value={schoolClass._id}>
              {schoolClass.name} · {schoolClass.section}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="rounded-2xl border border-(--border) p-8 text-center text-sm text-(--text-muted)">
          Loading assessments…
        </p>
      ) : filteredAssessments.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssessments.map((assessment) => (
            <article
              key={assessment._id}
              className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--primary)">
                    {assessment.type} · {assessment.academicSession}
                  </p>
                  <h2 className="mt-2 truncate text-lg font-bold">
                    {assessment.title}
                  </h2>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    assessment.status === "Published"
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-amber-500/10 text-amber-700"
                  }`}
                >
                  {assessment.status}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <AssessmentInfo
                  label="Class"
                  value={`${assessment.classId?.name || "Class"} · ${assessment.classId?.section || ""}`}
                />
                <AssessmentInfo
                  label="Subject"
                  value={assessment.subjectId?.name || "Subject"}
                />
                <AssessmentInfo
                  label="Scheduled"
                  value={new Date(assessment.scheduledAt).toLocaleDateString(
                    "en-IN",
                  )}
                />
                <AssessmentInfo
                  label="Pass / Maximum"
                  value={`${assessment.passMarks} / ${assessment.maxMarks}`}
                />
              </dl>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-(--border) pt-4">
                <button
                  type="button"
                  onClick={() => openResults(assessment)}
                  className="inline-flex items-center gap-2 rounded-lg border border-(--border) px-3 py-2 text-sm font-semibold hover:bg-(--primary-soft-hover)"
                >
                  <ClipboardList size={16} />
                  {canMark && assessment.status === "Draft"
                    ? "Enter marks"
                    : "View results"}
                </button>
                {canPublish && assessment.status === "Draft" && (
                  <button
                    type="button"
                    onClick={() => openResults(assessment)}
                    className="inline-flex items-center gap-2 rounded-lg bg-(--primary) px-3 py-2 text-sm font-semibold text-white"
                  >
                    <Send size={15} />
                    Review & publish
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-(--border) bg-(--glass-bg) p-10 text-center">
          <BookOpen size={30} className="mx-auto text-(--primary)" />
          <h2 className="mt-3 font-semibold">No assessments found</h2>
          <p className="mt-1 text-sm text-(--text-muted)">
            Create an assessment for a class and subject to begin recording
            results.
          </p>
        </div>
      )}

      {showCreate && (
        <Modal title="Create assessment" onClose={() => setShowCreate(false)}>
          <form onSubmit={createAssessment} className="space-y-4">
            <label className="block text-sm font-medium">
              Assessment title
              <Input name="title" required maxLength={120} className="mt-1.5" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Type
                <Select name="type" required className="mt-1.5 w-full">
                  {assessmentTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm font-medium">
                Class
                <Select
                  name="classId"
                  required
                  value={formClass}
                  onChange={(event) => setFormClass(event.target.value)}
                  className="mt-1.5 w-full"
                >
                  <option value="">Select class</option>
                  {classes.map((schoolClass) => (
                    <option key={schoolClass._id} value={schoolClass._id}>
                      {schoolClass.name} · {schoolClass.section}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm font-medium">
                Subject
                <Select
                  name="subjectId"
                  required
                  disabled={!formClass || subjects.length === 0}
                  className="mt-1.5 w-full"
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-sm font-medium">
                Academic session
                <Input
                  name="academicSession"
                  required
                  maxLength={30}
                  defaultValue={user?.schoolId?.academicSession || ""}
                  className="mt-1.5"
                />
              </label>
              <label className="block text-sm font-medium">
                Exam date
                <Input
                  name="scheduledAt"
                  type="date"
                  required
                  defaultValue={getLocalDate()}
                  className="mt-1.5"
                />
              </label>
              <label className="block text-sm font-medium">
                Maximum marks
                <Input
                  name="maxMarks"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="mt-1.5"
                />
              </label>
              <label className="block text-sm font-medium sm:col-span-2">
                Pass marks
                <Input
                  name="passMarks"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="mt-1.5"
                />
              </label>
            </div>
            {formClass && !subjects.length && (
              <p className="text-sm text-amber-700">
                No subjects are assigned to this class yet.
              </p>
            )}
            <ModalFooter
              onCancel={() => setShowCreate(false)}
              saving={saving}
              submitLabel="Create assessment"
            />
          </form>
        </Modal>
      )}

      {activeAssessment && (
        <Modal
          title={`${activeAssessment.title} · Results`}
          onClose={() => setActiveAssessment(null)}
          wide
        >
          {loadingResults ? (
            <p className="py-8 text-center text-sm text-(--text-muted)">
              Loading class results…
            </p>
          ) : students.length ? (
            <>
              <p className="mb-4 text-sm text-(--text-muted)">
                {activeAssessment.classId?.name} · {activeAssessment.subjectId?.name} ·
                Maximum {activeAssessment.maxMarks} marks
              </p>
              <div className="max-h-[55vh] overflow-auto rounded-xl border border-(--border)">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead className="sticky top-0 bg-(--primary-soft-hover)">
                    <tr>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Admission No.</th>
                      <th className="px-3 py-3">Marks / Absent</th>
                      <th className="px-3 py-3">Outcome</th>
                      <th className="px-3 py-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const result = marks[student._id] || {};
                      return (
                        <tr
                          key={student._id}
                          className="border-t border-(--border)"
                        >
                          <td className="px-3 py-3 font-medium">
                            {student.name}
                          </td>
                          <td className="px-3 py-3 text-(--text-muted)">
                            {student.admissionNumber}
                          </td>
                          <td className="px-3 py-3">
                            {canMark && activeAssessment.status === "Draft" ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  aria-label={`${student.name} marks`}
                                  type="number"
                                  min="0"
                                  max={activeAssessment.maxMarks}
                                  step="0.01"
                                  disabled={result.isAbsent}
                                  value={result.marks}
                                  onChange={(event) =>
                                    setMarks((current) => ({
                                      ...current,
                                      [student._id]: {
                                        ...current[student._id],
                                        marks: event.target.value,
                                      },
                                    }))
                                  }
                                  className="h-9 w-24 px-2"
                                />
                                <label className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                                  <input
                                    type="checkbox"
                                    checked={result.isAbsent}
                                    onChange={(event) =>
                                      setMarks((current) => ({
                                        ...current,
                                        [student._id]: {
                                          ...current[student._id],
                                          isAbsent: event.target.checked,
                                          marks: "",
                                        },
                                      }))
                                    }
                                  />
                                  Absent
                                </label>
                              </div>
                            ) : result.isAbsent ? (
                              "Absent"
                            ) : (
                              `${result.marks ?? "—"} / ${activeAssessment.maxMarks}`
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {result.isAbsent ? (
                              <span className="text-(--text-muted)">Absent</span>
                            ) : result.marks === "" || result.marks == null ? (
                              "—"
                            ) : Number(result.marks) >= activeAssessment.passMarks ? (
                              <span className="font-semibold text-emerald-700">
                                Pass
                              </span>
                            ) : (
                              <span className="font-semibold text-red-600">
                                Needs improvement
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {canMark && activeAssessment.status === "Draft" ? (
                              <Input
                                aria-label={`${student.name} remark`}
                                maxLength={500}
                                value={result.remark}
                                onChange={(event) =>
                                  setMarks((current) => ({
                                    ...current,
                                    [student._id]: {
                                      ...current[student._id],
                                      remark: event.target.value,
                                    },
                                  }))
                                }
                                className="h-9 min-w-36 px-2"
                              />
                            ) : (
                              result.remark || "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {activeAssessment.status === "Draft" && (
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {canMark && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveResults}
                      className="inline-flex items-center gap-2 rounded-lg border border-(--border) px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      <Check size={16} />
                      {saving ? "Saving…" : "Save draft"}
                    </button>
                  )}
                  {canPublish && (
                    <button
                      type="button"
                      disabled={saving || students.some((student) => {
                        const result = marks[student._id];
                        return !result?.isAbsent && result?.marks === "";
                      })}
                      onClick={publishResults}
                      className="inline-flex items-center gap-2 rounded-lg bg-(--primary) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <Send size={15} />
                      {saving ? "Publishing…" : "Publish results"}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-(--text-muted)">
              No active students are enrolled in this class.
            </p>
          )}
        </Modal>
      )}
    </main>
  );
};

const AssessmentInfo = ({ label, value }) => (
  <div>
    <dt className="text-xs text-(--text-muted)">{label}</dt>
    <dd className="mt-1 font-medium">{value}</dd>
  </div>
);

const Modal = ({ title, onClose, wide = false, children }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
    <section
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`max-h-[90vh] w-full ${wide ? "max-w-5xl" : "max-w-2xl"} overflow-y-auto rounded-2xl border border-(--border) bg-(--surface) p-5 shadow-2xl sm:p-6`}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 hover:bg-(--primary-soft-hover)"
        >
          <X size={18} />
        </button>
      </header>
      {children}
    </section>
  </div>
);

const ModalFooter = ({ onCancel, saving, submitLabel }) => (
  <footer className="flex justify-end gap-2 border-t border-(--border) pt-4">
    <button
      type="button"
      onClick={onCancel}
      className="rounded-lg border border-(--border) px-4 py-2 text-sm"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={saving}
      className="rounded-lg bg-(--primary) px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {saving ? "Saving…" : submitLabel}
    </button>
  </footer>
);

export default Assessments;
