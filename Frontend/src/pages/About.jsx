import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Input, Label, Select, Textarea, ThemeButton } from "../components/UI";
import FloatingParticles from "../components/FloatingParticles/FloatingPartcles";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  topic: "Product feedback",
  message: "",
  website: "",
};

export default function About() {
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAdmin = (user?.roleId?.role || user?.roleId?.name) === "Admin";
  const canReviewFeedback =
    isAdmin && user?.email?.toLowerCase() === "jeetpal.infotech@gmail.com";
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "NexaManage | About & feedback";
  }, []);

  useEffect(() => {
    if (loadingAuth) initializeAuth();
  }, [initializeAuth, loadingAuth]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    setSubmitted(false);
    try {
      const { data } = await api.post("/directory/feedback", form);
      if (!data.success) {
        throw new Error(data.message || "Your message could not be sent.");
      }
      setForm(initialForm);
      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          submitError.message ||
          "Your message could not be sent. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen text-slate-900">
      <FloatingParticles count={50} />
      <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-1rem)] max-w-7xl -translate-x-1/2 rounded-2xl border border-(--glass-border) bg-(--glass-bg)/50 backdrop-blur-xl  shadow-[0_8px_20px_var(--shadow-xl)] transition-all duration-300 flex justify-between items-center">
        <Link to="/" className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className=" flex h-10 w-10 items-center justify-center rounded-md bg-(--primary) text-lg font-bold text-white  shadow-[0_6px_20px_var(--shadow-color)">
              N
            </div>
            <span className="text-xl font-bold text-(--text)">NexaManage</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-sm font-medium sm:gap-6">
          <Link to="/features" className="text-slate-600 hover:text-indigo-700">
            Features
          </Link>
          <Link to="/about" className="text-indigo-700">
            About
          </Link>
          {canReviewFeedback && (
            <Link
              to="/admin/website-feedback"
              className="hidden text-slate-600 hover:text-indigo-700 sm:inline"
            >
              Feedback inbox
            </Link>
          )}
          <Link
            to="/"
            className="hidden text-slate-600 hover:text-indigo-700 sm:inline"
          >
            Home
          </Link>
        </nav>

        <div className="flex items-center gap-2 pr-2">
          <ThemeButton />
          <div className="relative group">
            <Link
              to="/create/organisation"
              className="rounded-xl  px-3 py-2 text-xs font-semibold text-(--text) hover:bg-indigo-700 sm:px-4 sm:text-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden  px-4 py-24 text-(--text) sm:px-6 sm:py-24">
        <div className="absolute -right-24 -top-28 -z-10 size-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em]">
            About NexaManage
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl text-(--primary)">
                Making <span className="text-(--text)">school management </span>{" "}
                <span className="text-sky-500"> feel more manageable.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-(--text) sm:text-lg">
                NexaManage is a school management platform designed to bring
                essential administrative and academic work into one clear,
                connected workspace.
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-950 hover:bg-blue-50"
            >
              Share your feedback <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            Founder & creator
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-xl font-bold text-white shadow-lg shadow-indigo-200">
              JP
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Jeet Pal</h2>
              <p className="mt-1 text-sm font-medium text-indigo-700">
                Software Engineer
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-600">
            Jeet Pal is building NexaManage to help schools bring their everyday
            work—from student and staff records to academics and administration—
            into a more organized digital workspace.
          </p>
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            <a
              href="mailto:jeetpal.infotech@gmail.com"
              className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-indigo-700"
            >
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                <Mail size={16} />
              </span>
              jeetpal.infotech@gmail.com
            </a>
            <a
              href="tel:+918726156494"
              className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-indigo-700"
            >
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                <Phone size={16} />
              </span>
              +91 87261 56494
            </a>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck size={21} />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            A platform shaped around real school work
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Schools handle many connected responsibilities every day. NexaManage
            provides dedicated areas for managing people, classes, attendance,
            fees, assessments, admissions, and staff access—so teams can keep
            important work organized and easier to follow.
          </p>
          <Link
            to="/features"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Explore all features <ArrowRight size={17} />
          </Link>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {["Clear workflows", "Role-aware access", "Connected records"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700"
                >
                  <CheckCircle2
                    size={16}
                    className="shrink-0 text-emerald-600"
                  />
                  {item}
                </div>
              ),
            )}
          </div>
        </article>
      </section>

      <section
        id="contact"
        className="scroll-mt-20 border border-(--border) rounded-2xl px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <MessageSquareText size={23} />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
              Contact & feedback
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Help us make it better.
            </h2>
            <p className="mt-4 max-w-md leading-7 text-slate-600">
              Share a question, suggestion, or product feedback. Your message
              will be saved for the NexaManage team to review and follow up.
            </p>
            <div className="mt-6 flex items-start gap-3 text-sm text-slate-600">
              <MapPin size={17} className="mt-0.5 shrink-0 text-indigo-600" />
              <span>
                For schools and education teams looking for a more organized way
                to work.
              </span>
            </div>
          </div>

          <form
            onSubmit={submitFeedback}
            className="space-y-4 rounded-3xl border border-slate-200 bg-(--primary-soft) p-5 shadow-sm sm:p-8"
          >
            {submitted && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              >
                <CheckCircle2 size={18} /> Thanks for your message. We’ve
                received your feedback.
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="">
                <Label
                  required
                  className="text-sm font-semibold text-slate-700"
                >
                  Your name
                </Label>
                <Input
                  required
                  maxLength={100}
                  value={form.name}
                  placeholder="Enter Your Name"
                  onChange={updateField("name")}
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft-hover)"
                />
              </div>
              <div className="">
                <Label
                  required
                  className="text-sm font-semibold text-slate-700"
                >
                  Email address
                </Label>
                <Input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={updateField("email")}
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft-hover)"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="">
                <Label className="text-sm font-semibold text-slate-700">
                  Phone (optional)
                </Label>
                <Input
                  type="tel"
                  maxLength={30}
                  value={form.phone}
                  onChange={updateField("phone")}
                  autoComplete="tel"
                  className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft-hover)"
                />
              </div>
              <div className="">
                <Label
                  required
                  className="text-sm font-semibold text-slate-700"
                >
                  What is this about?
                </Label>
                <Select
                  value={form.topic}
                  onChange={updateField("topic")}
                  className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft-hover)"
                >
                  <option>Product feedback</option>
                  <option>Request a demo</option>
                  <option>Question</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </Select>
              </div>
            </div>
            <div className="">
              <Label
                required
                className="block text-sm font-semibold text-slate-700"
              >
                Your message
              </Label>
              <Textarea
                required
                minLength={5}
                maxLength={3000}
                rows={5}
                value={form.message}
                onChange={updateField("message")}
                placeholder="Tell us what you think or how we can help..."
                className="mt-1.5 w-full resize-y rounded-xl border border-(--border) bg-(--primary-soft-hover)"
              />
              <span className="mt-1 block text-right text-xs font-normal text-slate-500">
                {form.message.length}/3000
              </span>
            </div>
            <div
              aria-hidden="true"
              className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
            >
              <label>
                Leave this field empty
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={updateField("website")}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--primary)/90 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} /> {sending ? "Sending..." : "Send feedback"}
            </button>
            <p className="text-xs leading-5 text-slate-500">
              By sending this form, you agree that we may use these details to
              respond to your message.
            </p>
          </form>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-7 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NexaManage ·{" "}
        <Link to="/" className="font-medium text-indigo-700 hover:underline">
          Home
        </Link>
      </footer>
    </main>
  );
}
