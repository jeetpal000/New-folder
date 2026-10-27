import {
  ArrowDown,
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  ClipboardCheck,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  Megaphone,
  School,
  UsersRound,
} from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const modules = [
  {
    icon: School,
    title: "School workspace",
    description:
      "Create a school workspace with its identity, contact details, school profile, and academic setup in one guided flow.",
    label: "Start here",
    tone: "bg-blue-50 text-blue-700",
  },
  {
    icon: UsersRound,
    title: "Students and teachers",
    description:
      "Keep student and staff records together. Assign teachers to classes and subjects, and view detailed student or teacher profiles.",
    label: "People",
    tone: "bg-violet-50 text-violet-700",
  },
  {
    icon: CalendarCheck2,
    title: "Attendance and leave",
    description:
      "Mark attendance by class, review attendance records, and manage leave requests with a clear approval workflow.",
    label: "Daily operations",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: Landmark,
    title: "Fees and payments",
    description:
      "Create student fee accounts, review balances, and record fee payments so families' accounts stay up to date.",
    label: "Finance",
    tone: "bg-amber-50 text-amber-800",
  },
  {
    icon: BookOpenCheck,
    title: "Assessments",
    description:
      "Set up class assessments, enter marks, and publish results after checking that every active student has a result.",
    label: "Academics",
    tone: "bg-cyan-50 text-cyan-800",
  },
  {
    icon: Megaphone,
    title: "Admissions and school profile",
    description:
      "Publish a public school profile, share facilities and highlights, receive admission applications, and review them in the workspace.",
    label: "Public presence",
    tone: "bg-rose-50 text-rose-700",
  },
  {
    icon: LockKeyhole,
    title: "Staff access and permissions",
    description:
      "Give staff access appropriate to their role, with permissions that control which school tools and records they can use.",
    label: "Access control",
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    icon: LayoutDashboard,
    title: "School overview",
    description:
      "Bring the key areas of school administration into one workspace instead of juggling disconnected lists and processes.",
    label: "One workspace",
    tone: "bg-slate-100 text-slate-700",
  },
];

const workflow = [
  {
    number: "01",
    title: "Create your workspace",
    description:
      "Register the administrator, add school details, and complete the guided school profile setup.",
  },
  {
    number: "02",
    title: "Set up classes and access",
    description:
      "Configure classes and subjects, then add staff and assign roles that fit their responsibilities.",
  },
  {
    number: "03",
    title: "Add your school community",
    description:
      "Create student and teacher records, connect teachers to their classes, and keep contact details in one place.",
  },
  {
    number: "04",
    title: "Run everyday operations",
    description:
      "Use the workspace to handle attendance, leave requests, fee accounts and payments, and assessments.",
  },
  {
    number: "05",
    title: "Review and improve",
    description:
      "Check submitted admissions, publish school information, and use the available records to keep work moving.",
  },
];

export default function Features() {
  useEffect(() => {
    document.title = "NexaManage | Features";
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm">N</span>
            <span>NexaManage</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium sm:gap-6">
            <Link to="/features" className="text-indigo-700">Features</Link>
            <Link to="/about" className="text-slate-600 hover:text-indigo-700">About</Link>
            <Link to="/" className="hidden text-slate-600 hover:text-indigo-700 sm:inline">Home</Link>
          </nav>
          <Link to="/create/organisation" className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 sm:px-4 sm:text-sm">
            Get started
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 px-4 py-20 text-white sm:px-6 sm:py-28">
        <div className="absolute -right-28 -top-32 -z-10 size-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
            <GraduationCap size={15} /> Built for school operations
          </p>
          <div className="mt-7 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                Every school task,{" "}
                <span className="text-blue-300">better connected.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                NexaManage brings people, academics, finance, and school
                administration into one practical workspace. Explore what each
                area does and how they fit together.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/create/organisation" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-950 transition hover:-translate-y-0.5">
                  Create a workspace <ArrowRight size={17} />
                </Link>
                <a href="#workflow" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                  See how it works <ArrowDown size={17} />
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <p className="text-sm font-semibold text-blue-100">One connected workflow</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["People", "Students and staff"],
                  ["Academics", "Classes and results"],
                  ["Operations", "Attendance and leave"],
                  ["Finance", "Fees and payments"],
                ].map(([title, detail], index) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <span className="text-xs font-bold tracking-widest text-blue-300">0{index + 1}</span>
                    <p className="mt-3 font-bold">{title}</p>
                    <p className="mt-1 text-xs text-blue-100/80">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">Platform features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Tools that work together</h2>
          <p className="mt-4 leading-7 text-slate-600">
            Start with the essentials, then bring more of your school’s daily work into the same system.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map(({ icon: Icon, title, description, label, tone }) => (
            <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
                  <Icon size={21} />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">Step by step</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From setup to everyday use</h2>
            <p className="mt-4 leading-7 text-slate-600">
              A simple sequence helps your team get started without losing sight of the daily workflow.
            </p>
          </div>
          <ol className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-5">
            {workflow.map((step) => (
              <li key={step.number} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-mono text-sm font-bold text-indigo-600">{step.number}</span>
                <h3 className="mt-4 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <Link to="/about#contact" className="inline-flex items-center gap-2 font-semibold text-indigo-700 hover:text-indigo-900">
              Have a question? Talk to us <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-7 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NexaManage · <Link to="/" className="font-medium text-indigo-700 hover:underline">Home</Link>
      </footer>
    </main>
  );
}
