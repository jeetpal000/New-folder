import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select, Textarea } from "../../components/UI";
import { api } from "../../services/api";
import { toDateInputValue } from "../../utils/date";

const initialForm = {
  name: "",
  classId: "",
  rollNumber: "",
  admissionNumber: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
  isActive: true,
};

const StudentEditDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    document.title = "NexaManage | Edit Student";
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStudent = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [studentResponse, classesResponse] = await Promise.all([
          api.get(`/student-alldetails/${id}`),
          api.get("/get-classes"),
        ]);
        const student = studentResponse.data.student;

        if (!studentResponse.data.success || !student) {
          throw new Error("Student details could not be loaded.");
        }
        if (!classesResponse.data.success) {
          throw new Error("Classes could not be loaded.");
        }
        if (cancelled) return;

        setClasses(classesResponse.data.classes || []);
        setCurrentPhoto(student.photo || null);
        setSelectedPhoto(null);
        setRemovePhoto(false);
        setFormData({
          name: student.name || "",
          classId: student.classId?._id || "",
          rollNumber: student.rollNumber || "",
          admissionNumber: student.admissionNumber || "",
          dateOfBirth: toDateInputValue(student.dateOfBirth),
          gender: student.gender || "",
          phone: student.phone || "",
          email: student.email || "",
          guardianName: student.guardianName || "",
          guardianPhone: student.guardianPhone || "",
          address: student.address || "",
          isActive: Boolean(student.isActive),
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error.response?.data?.message ||
              error.message ||
              "Could not load student details.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStudent();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!selectedPhoto) {
      setSelectedPhotoPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedPhoto);
    setSelectedPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedPhoto]);

  const updateField = (field) => (event) =>
    setFormData((current) => ({ ...current, [field]: event.target.value }));

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const payload = new FormData();
      Object.entries({
        ...formData,
        dateOfBirth: formData.dateOfBirth || "",
        email: formData.email.trim(),
        removePhoto,
      }).forEach(([key, value]) => payload.append(key, value));
      if (selectedPhoto) payload.append("photo", selectedPhoto);
      await api.put(`/students/${id}`, payload);
      navigate(`/students/details/${id}`, {
        replace: true,
        state: { message: "Student information updated successfully." },
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not update student.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="p-8 text-center text-sm text-(--text-muted)">
        Loading student details…
      </p>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 pb-8">
      <button
        type="button"
        onClick={() => navigate(`/students/details/${id}`)}
        className="inline-flex items-center gap-2 text-sm text-(--text-muted) transition hover:text-(--primary)"
      >
        <ArrowLeft size={17} />
        Back to student profile
      </button>

      <form
        onSubmit={submitForm}
        className="overflow-hidden rounded-2xl border border-(--border) bg-(--glass-bg) shadow-sm"
      >
        <header className="border-b border-(--border) px-5 py-5 sm:px-7">
          <h1 className="text-2xl font-bold text-(--text)">Edit Student</h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            Update personal, academic, and guardian information.
          </p>
        </header>

        <div className="space-y-6 p-5 sm:p-7">
          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600"
            >
              {errorMessage}
            </p>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold">Student Photo</h2>
            <div className="flex flex-wrap items-center gap-4">
              {selectedPhotoPreview ? (
                <img
                  src={selectedPhotoPreview}
                  alt={`${formData.name} photo preview`}
                  className="size-20 rounded-full object-cover"
                />
              ) : currentPhoto?.url && !removePhoto ? (
                <img
                  src={currentPhoto.url}
                  alt={`${formData.name} photo`}
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-(--primary-soft) text-2xl font-bold text-(--primary)">
                  {formData.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <div className="space-y-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    setSelectedPhoto(event.target.files?.[0] || null);
                    setRemovePhoto(false);
                    event.currentTarget.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="rounded-lg border border-(--border) px-3 py-2 text-sm font-medium hover:bg-(--primary-soft)"
                >
                  Change photo
                </button>
                {selectedPhoto && (
                  <p className="text-xs text-(--text-muted)">
                    Selected: {selectedPhoto.name}
                  </p>
                )}
                {(currentPhoto || selectedPhoto) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setRemovePhoto(Boolean(currentPhoto));
                    }}
                    className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={15} />
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Personal Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full Name"
                required
                value={formData.name}
                onChange={updateField("name")}
              />
              <FormField
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={updateField("dateOfBirth")}
              />
              <FormField
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={updateField("phone")}
              />
              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={updateField("email")}
              />
              <label className="block text-sm font-medium">
                Gender
                <Select
                  value={formData.gender}
                  onChange={updateField("gender")}
                  className="mt-1.5 w-full"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Academic Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Class
                <Select
                  required
                  value={formData.classId}
                  onChange={updateField("classId")}
                  className="mt-1.5 w-full"
                >
                  <option value="">Select a class</option>
                  {classes.map((schoolClass) => (
                    <option key={schoolClass._id} value={schoolClass._id}>
                      {schoolClass.name} - {schoolClass.section}
                    </option>
                  ))}
                </Select>
                {classes.length === 0 && (
                  <span className="mt-1 block text-xs text-(--danger)">
                    No active classes are available.
                  </span>
                )}
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
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Parent / Guardian</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Guardian Name"
                value={formData.guardianName}
                onChange={updateField("guardianName")}
              />
              <FormField
                label="Guardian Phone"
                type="tel"
                value={formData.guardianPhone}
                onChange={updateField("guardianPhone")}
              />
            </div>
          </section>

          <label className="block text-sm font-medium">
            Address
            <Textarea
              rows={3}
              value={formData.address}
              onChange={updateField("address")}
              className="mt-1.5 w-full resize-y"
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="size-4 accent-(--primary)"
            />
            Active student
          </label>
        </div>

        <footer className="flex justify-end gap-3 border-t border-(--border) px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={() => navigate(`/students/details/${id}`)}
            className="rounded-xl border border-(--border) px-4 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || classes.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-(--primary) px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </footer>
      </form>
    </main>
  );
};

const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  required = false,
}) => (
  <label className="block text-sm font-medium">
    {label}
    <Input
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1.5"
    />
  </label>
);

export default StudentEditDetailsPage;
