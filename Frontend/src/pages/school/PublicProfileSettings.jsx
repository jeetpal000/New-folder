import { useEffect, useState } from "react";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { api } from "../../services/api";

const categories = [
  ["feature", "School feature"],
  ["award", "Award / achievement"],
  ["picnic", "Picnic / activity"],
  ["tour", "Educational tour"],
  ["function", "Event / function"],
];

const PublicProfileSettings = () => {
  const [school, setSchool] = useState(null);
  const [facilitiesText, setFacilitiesText] = useState("");
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/admin/public-profile");
        const record = response.data.school;
        setSchool(record);
        setFacilitiesText((record.facilities || []).join("\n"));
        setAdmissionOpen(Boolean(record.admissionOpen));
        setHighlights(record.publicHighlights || []);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Could not load public school profile settings.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const updateHighlight = (index, field, value) => {
    setHighlights((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.put("/admin/public-profile", {
        admissionOpen,
        facilities: facilitiesText
          .split("\n")
          .map((facility) => facility.trim())
          .filter(Boolean),
        publicHighlights: highlights,
      });
      setSchool(response.data.school);
      setFacilitiesText((response.data.school.facilities || []).join("\n"));
      setHighlights(response.data.school.publicHighlights || []);
      setMessage(response.data.message || "Profile saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Public school profile could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-(--text-muted)">Loading public profile settings…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--primary)">
            Public school listing
          </p>
          <h1 className="mt-1 text-2xl font-bold">School profile content</h1>
          <p className="mt-2 text-sm text-(--text-muted)">
            Manage what families see in the public directory, including class
            subjects, school features and event photos.
          </p>
        </div>
        {school?.slug && (
          <a
            href={`/schools/${encodeURIComponent(school.slug)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-(--border) px-4 py-2.5 text-sm font-semibold"
          >
            Preview profile <ExternalLink size={16} />
          </a>
        )}
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <form onSubmit={saveProfile} className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-(--border) bg-(--glass-bg) p-5">
          <div>
            <h2 className="text-lg font-semibold">Admissions</h2>
            <p className="text-sm text-(--text-muted)">
              Turn this on when families should be able to submit applications.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={admissionOpen}
              onChange={(event) => setAdmissionOpen(event.target.checked)}
              className="size-4 accent-(--primary)"
            />
            Accept public admission applications
          </label>
        </section>

        <section className="space-y-3 rounded-2xl border border-(--border) bg-(--glass-bg) p-5">
          <div>
            <h2 className="text-lg font-semibold">Facilities</h2>
            <p className="text-sm text-(--text-muted)">
              Enter one facility per line.
            </p>
          </div>
          <textarea
            rows={6}
            value={facilitiesText}
            onChange={(event) => setFacilitiesText(event.target.value)}
            placeholder={"Library\nScience laboratory\nSports ground"}
            className="w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-sm"
          />
        </section>

        <section className="space-y-4 rounded-2xl border border-(--border) bg-(--glass-bg) p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Features, awards & school life</h2>
              <p className="text-sm text-(--text-muted)">
                Add one item per section. Photo links must be publicly accessible HTTPS URLs.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setHighlights((current) => [
                  ...current,
                  { category: "feature", title: "", description: "", imageUrl: "" },
                ])
              }
              className="inline-flex items-center gap-2 rounded-xl bg-(--primary-soft) px-3 py-2 text-sm font-semibold text-(--primary)"
            >
              <Plus size={16} /> Add section item
            </button>
          </div>

          {highlights.map((item, index) => (
            <article
              key={item._id || `new-${index}`}
              className="grid gap-3 rounded-xl border border-(--border) p-4 sm:grid-cols-2"
            >
              <label className="text-sm font-medium">
                Section
                <select
                  value={item.category}
                  onChange={(event) =>
                    updateHighlight(index, "category", event.target.value)
                  }
                  className="mt-1 block w-full rounded-lg border border-(--border) bg-(--surface) px-3 py-2"
                >
                  {categories.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Title
                <input
                  required
                  maxLength={100}
                  value={item.title}
                  onChange={(event) =>
                    updateHighlight(index, "title", event.target.value)
                  }
                  className="mt-1 block w-full rounded-lg border border-(--border) bg-(--surface) px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Photo URL (optional)
                <input
                  type="url"
                  value={item.imageUrl || ""}
                  onChange={(event) =>
                    updateHighlight(index, "imageUrl", event.target.value)
                  }
                  placeholder="https://example.com/school-event.jpg"
                  className="mt-1 block w-full rounded-lg border border-(--border) bg-(--surface) px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Description (optional)
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={item.description || ""}
                  onChange={(event) =>
                    updateHighlight(index, "description", event.target.value)
                  }
                  className="mt-1 block w-full rounded-lg border border-(--border) bg-(--surface) px-3 py-2"
                />
              </label>
              <div className="flex justify-end sm:col-span-2">
                <button
                  type="button"
                  onClick={() =>
                    setHighlights((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="inline-flex items-center gap-2 text-sm text-red-600"
                >
                  <Trash2 size={15} /> Remove item
                </button>
              </div>
            </article>
          ))}
          {highlights.length === 0 && (
            <p className="rounded-xl bg-(--primary-soft-hover) p-4 text-sm text-(--text-muted)">
              No public features or event photos added yet.
            </p>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !school}
            className="inline-flex items-center gap-2 rounded-xl bg-(--primary) px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <Save size={17} /> {saving ? "Saving…" : "Save public profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicProfileSettings;
