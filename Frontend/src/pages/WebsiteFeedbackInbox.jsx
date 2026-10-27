import { useCallback, useEffect, useState } from "react";
import { Check, CheckCheck, Inbox, Mail, MessageSquareText, Phone, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const filters = ["All", "New", "Reviewed", "Resolved"];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default function WebsiteFeedbackInbox() {
  const [status, setStatus] = useState("All");
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/directory/admin/website-feedback", {
        params: status === "All" ? {} : { status },
      });
      setFeedback(data.feedback || []);
    } catch (loadError) {
      setError(
        loadError.response?.data?.message || "Could not load website feedback.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const updateStatus = async (item, nextStatus) => {
    setUpdatingId(item._id);
    setError("");
    try {
      await api.patch(`/directory/admin/website-feedback/${item._id}`, {
        status: nextStatus,
      });
      await loadFeedback();
    } catch (updateError) {
      setError(
        updateError.response?.data?.message ||
          "Could not update this feedback status.",
      );
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/about#contact" className="text-sm font-semibold text-indigo-700 hover:underline">
            About page
          </Link>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Inbox className="text-indigo-600" size={23} /> Website feedback
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review messages submitted from the public About page.
          </p>
        </div>
        <button
          type="button"
          onClick={loadFeedback}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter feedback by status">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={status === filter}
            onClick={() => setStatus(filter)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              status === filter
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading feedback…
        </div>
      ) : feedback.length ? (
        <section className="space-y-3">
          {feedback.map((item) => (
            <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-slate-900">{item.name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-700"
                        : item.status === "Reviewed"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-800"
                    }`}>
                      {item.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {item.topic}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "New" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(item, "Reviewed")}
                      disabled={updatingId === item._id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Check size={14} /> Mark reviewed
                    </button>
                  )}
                  {item.status !== "Resolved" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(item, "Resolved")}
                      disabled={updatingId === item._id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCheck size={14} /> Resolve
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
                <a href={`mailto:${item.email}`} className="inline-flex items-center gap-2 hover:text-indigo-700">
                  <Mail size={15} /> {item.email}
                </a>
                {item.phone && (
                  <a href={`tel:${item.phone}`} className="inline-flex items-center gap-2 hover:text-indigo-700">
                    <Phone size={15} /> {item.phone}
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <MessageSquareText size={28} className="mx-auto text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-800">No feedback here yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            New messages submitted through the About page will appear here.
          </p>
        </div>
      )}
      {!loading && feedback.length === 100 && (
        <p className="text-center text-xs text-slate-500">
          Showing the latest 100 messages.
        </p>
      )}
    </main>
  );
}
