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
  Menu,
  School,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ThemeButton } from "../components/UI";

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
  const [menu, setMenu] = useState(false);

  return (
    <main className="min-h-screen text-slate-900">
      <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-1rem)] max-w-7xl -translate-x-1/2 rounded-2xl border border-(--glass-border) bg-(--glass-bg)/50 backdrop-blur-xl  shadow-[0_8px_20px_var(--shadow-xl)] transition-all duration-300 flex justify-between items-center">
        <Link to="/" className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className=" flex h-10 w-10 items-center justify-center rounded-md bg-(--primary) text-lg font-bold text-white  shadow-[0_6px_20px_var(--shadow-color)">
              N
            </div>
            <span className="text-xl font-bold text-(--text)">NexaManage</span>
          </div>
        </Link>

        <nav
          className={`${menu ? " absolute  -right-5 top-16  space-y-2 flex pl-10 flex-col gap-2 bg-(--primary-soft) px-2 py-2 w-[70%]" : " items-center gap-2 text-xs font-medium text-(--text) sm:gap-4 sm:text-sm hidden sm:flex "}`}
        >
          <Link to="/features" className="text-slate-600 hover:text-indigo-700">
            Features
          </Link>
          <Link to="/about" className="hover:text-indigo-700">
            About
          </Link>
          {/* {canReviewFeedback && (
            <Link
              to="/admin/website-feedback"
              className="hidden text-slate-600 hover:text-indigo-700 sm:inline"
            >
              Feedback inbox
            </Link>
          )} */}
          <Link
            to="/"
            className="hidden text-slate-600 hover:text-indigo-700 sm:inline"
          >
            Home
          </Link>
        </nav>

        <div
          className={` ${menu ? "absolute -right-5 top-33 flex pl-10 flex-col space-y-2 bg-(--primary-soft) px-2 py-4 w-[70%] " : "sm:flex hidden items-center gap-2 pr-2"}`}
        >
          <ThemeButton />
          <div className="relative group">
            <Link
              to="/create/organisation"
              className="rounded-xl  px-3 py-2 text-xs font-semibold text-(--text) hover:bg-(--primary-soft) sm:px-4 sm:text-sm border border-(--border)"
            >
              Get started
            </Link>
          </div>
        </div>
        <div className="sm:hidden pr-2">
          {menu ? (
            <X
              size={40}
              className="px-1.5 py-2 border border-(--border) rounded-tr-md rounded-bl-md"
              onClick={() => setMenu(!menu)}
            />
          ) : (
            <Menu
              size={40}
              className="px-1.5 py-2 border border-(--border) rounded-tr-md rounded-bl-md"
              onClick={() => setMenu(!menu)}
            />
          )}
        </div>
      </header>

      <section className="relative isolate overflow-hidden px-4 py-24 text-(--text) sm:px-6 sm:py-28">
        <div className="absolute -right-28 -top-32 -z-10 size-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--text)">
            <GraduationCap size={15} /> Built for school operations
          </p>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 pl-5 mt-2">
            Platform features
          </p>
          <div className="mt-7 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                Every school task,{" "}
                <span className="text-sky-500">better connected.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-(--text) sm:text-lg">
                NexaManage brings people, academics, finance, and school
                administration into one practical workspace. Explore what each
                area does and how they fit together.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/create/organisation"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-(--primary) transition hover:-translate-y-0.5"
                >
                  Create a workspace <ArrowRight size={17} />
                </Link>
                <a
                  href="#workflow"
                  className="inline-flex items-center gap-2 rounded-xl border border-(--border) px-5 py-3 font-semibold text-(text) transition hover:bg-white/10"
                >
                  See how it works <ArrowDown size={17} />
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-(--border) bg-(--primary-soft) p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <p className="text-sm font-semibold text-(--text)">
                One connected workflow
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["People", "Students and staff"],
                  ["Academics", "Classes and results"],
                  ["Operations", "Attendance and leave"],
                  ["Finance", "Fees and payments"],
                ].map(([title, detail], index) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-(--border) bg-linear-to-br from-(--card-gradient-1)/50 via-(--card-gradient-2) to-(--card-gradient-1)/50 p-4"
                  >
                    <span className="text-xs font-bold font-mono tracking-widest text-(--info)">
                      0{index + 1}
                    </span>
                    <p className="mt-3 font-bold text-(--primary)">{title}</p>
                    <p className="mt-1 text-xs text-(--text)">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Tools that work together
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Start with the essentials, then bring more of your school’s daily
            work into the same system.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map(({ icon: Icon, title, description, label, tone }) => (
            <article
              key={title}
              className="group rounded-2xl border border-(--border) bg-(--primary-soft) p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid size-11 place-items-center rounded-xl ${tone}`}
                >
                  <Icon size={21} />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="scroll-mt  px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
              Step by step
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From setup to everyday use
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              A simple sequence helps your team get started without losing sight
              of the daily workflow.
            </p>
          </div>
          <ol className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-5">
            {workflow.map((step) => (
              <li
                key={step.number}
                className="relative rounded-2xl border border-slate-200 bg-linear-to-br from-(--card-gradient-1)/50 via-(--card-gradient-2) to-(--card-gradient-1)/50 p-5"
              >
                <span className="font-mono text-sm font-bold text-indigo-600">
                  {step.number}
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <Link
              to="/about#contact"
              className="inline-flex items-center gap-2 font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Have a question? Talk to us <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-(--border) px-4 py-10 sm:px-6 lg:px-8">
        <div
          className="
            mx-auto
            flex max-w-7xl
            flex-col
            items-center
            justify-between
            gap-5
            md:flex-row
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-lg
                bg-(--primary)
                font-bold
                text-white
              "
            >
              N
            </div>

            <div>
              <div className="font-bold">NexaManage</div>
              <div className="text-xs text-(--text-muted)">
                School management, in one place.
              </div>
            </div>
          </div>

          <div className="text-xs text-(--text-muted)">
            © {new Date().getFullYear()} NexaManage. All rights reserved.{" "}
            <span className="text-(--primary) text-[9px]">JEET PAL</span>
          </div>

          <div className="text-sm text-(--text-secondary) grid grid-cols-3 gap-2">
            <NavLink to="/features" className="hover:text-(--primary)">
              Features
            </NavLink>
            <NavLink
              to="/about"
              className="hover:text-(--primary) text-nowrap -ml-5 sm:ml-0"
            >
              About & feedback
            </NavLink>
            <NavLink
              to="/#schools"
              className="hover:text-(--primary) text-nowrap"
            >
              Find a school
            </NavLink>
            <NavLink to="/login" className="hover:text-(--primary)">
              Login
            </NavLink>
            <NavLink
              to="/create/organisation"
              className="hover:text-(--primary) text-nowrap"
            >
              Create a school workspace
            </NavLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
