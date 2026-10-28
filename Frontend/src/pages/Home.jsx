import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  Menu,
  Search,
  Sparkles,
  User2,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Input, ThemeButton } from "../components/UI";
import { managementTypes } from "../data/organisationData";
import FloatingParticles from "../components/FloatingParticles/FloatingPartcles";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const authError = useAuthStore((state) => state.error);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schools, setSchools] = useState([]);
  const [schoolError, setSchoolError] = useState("");
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [menu, setMenu] = useState(false);

  const searchSchools = useCallback(async () => {
    setSchoolsLoading(true);
    setSchoolError("");
    try {
      const response = await api.get("/directory/schools", {
        params: { q: schoolSearch.trim() || undefined },
      });
      setSchools(response.data.schools || []);
    } catch (error) {
      setSchoolError(
        error.response?.data?.message || "Schools could not be loaded.",
      );
    } finally {
      setSchoolsLoading(false);
    }
  }, [schoolSearch]);

  useEffect(() => {
    document.title = "NexaManage | School Management Platform";
  }, []);
  useEffect(() => {
    if (loadingAuth) initializeAuth();
  }, [initializeAuth, loadingAuth]);
  useEffect(() => {
    const timer = setTimeout(searchSchools, 700);
    return () => clearTimeout(timer);
  }, [searchSchools]);

  // const [openOrganisation, setOpenOrganisation] = useState(false);

  return (
    <main className="max-w-7xl mx-auto ">
      <FloatingParticles count={28} />
      <div className="z-50 relative">
        <div className="absolute right-0 -top-28 -z-10 size-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-1rem)] max-w-7xl -translate-x-1/2 rounded-2xl border border-(--glass-border) bg-(--glass-bg)/50 backdrop-blur-xl  shadow-[0_8px_20px_var(--shadow-xl)] transition-all duration-300 flex justify-between items-center">
          <div className="flex h-16 items-center justify-between px-5">
            <div className="flex items-center gap-2">
              <div className=" flex h-10 w-10 items-center justify-center rounded-md bg-(--primary) text-lg font-bold text-white  shadow-[0_6px_20px_var(--shadow-color)">
                N
              </div>
              <span className="text-xl font-bold text-(--text)">
                NexaManage
              </span>
            </div>
          </div>

          <nav
            className={`${menu ? " absolute  -right-5 top-16  space-y-2 flex pl-10 flex-col gap-2 bg-(--primary-soft) px-2 py-2 w-[70%]" : " items-center gap-2 text-xs font-medium text-(--text) sm:gap-4 sm:text-sm hidden sm:flex "}`}
          >
            <NavLink
              to="/features"
              className="transition hover:text-(--primary)"
            >
              Features
            </NavLink>
            <NavLink to="/about" className="transition hover:text-(--primary)">
              About
            </NavLink>
            <a
              href="/#schools"
              className="hidden transition hover:text-(--primary) lg:inline"
            >
              Schools
            </a>
          </nav>

          <div
            className={` ${menu ? "absolute -right-5 top-33 flex pl-10 flex-col space-y-2 bg-(--primary-soft) px-2 py-4 w-[70%] " : "sm:flex hidden items-center gap-2 pr-2"}`}
          >
            <ThemeButton />
            <div className="relative group">
              <NavLink
                rel=""
                to={user ? "/dashboard" : "/login"}
                className="flex items-center justify-center border rounded-md border-(--border) px-2 py-1.5 transition-all duration-300 hover:border-(--primary) hover:text-(--primary) bg-(--surface) size-10 text-(--text)"
              >
                {user ? <ArrowRight size={17} /> : <User2 size={17} />}

                <span className="pointer-events-none absolute -left-14 -translatex-1/2 top-full mt-2 whitespace-nowrap rounded-lg bg-(--surface) px-3 py-1.5 text-xs text-(--text) opacity-0 invisible translate-y-2 translate-x-4 shadow-[0_8px_20px_var(--shadow-xl)] transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0">
                  {user ? "Go to dashboard" : "Login to your workspace"}
                </span>
              </NavLink>
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

        <section className="relative isolate mt-25 overflow-hidden px-4 pb-14 pt-8 sm:px-6 sm:pb-20">
          <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-80 w-[min(90vw,900px)] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}

            <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--glass-bg) px-4 py-2 text-sm text-(--text-secondary) backdrop-blur-md">
              <Sparkles size={15} className="text-(--primary)" />
              Smart Management Platform
            </div>

            {/* Heading */}

            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-(--text) sm:text-6xl lg:text-7xl">
              Manage Your School
              <span className="block bg-gradient-to-r from-(--primary) to-sky-500 bg-clip-text text-transparent">
                Smarter.
              </span>
            </h1>

            {/* Description */}

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-(--text-secondary) sm:text-lg">
              Bring student and staff records, admissions, attendance, fees, and
              academic workflows together in one clear school workspace.
            </p>

            {/* CTA */}

            <div className="mt-9 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <button
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                disabled={loadingAuth}
                className="group flex items-center gap-2 rounded-2xl bg-(--primary) px-7 py-4 text-base font-bold text-white shadow-[0_12px_35px_var(--shadow-color)] transform transition-transform duration-300 hover:-translate-y-1 hover:bg-(--primary-hover) hover:shadow-[0_18px_45px_var(--shadow-color)]"
              >
                {loadingAuth
                  ? "Checking your workspace..."
                  : user
                    ? "Go to your dashboard"
                    : "Login to your workspace"}
                <ArrowRight
                  size={19}
                  className="transition-all duration-300 group-hover:translate-x-1"
                />
              </button>

              {!user && !loadingAuth && (
                <button
                  type="button"
                  onClick={() => navigate("/create/organisation")}
                  className="rounded-2xl border border-(--border) bg-(--glass-bg) px-7 py-4 font-semibold text-(--text) backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-(--primary) hover:text-(--primary)"
                >
                  Create a school workspace
                </button>
              )}
              <Link
                to="/features"
                className="rounded-2xl border border-(--border) bg-(--glass-bg) px-7 py-4 text-(--text) font-semibold backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-(--primary) hover:text-(--primary)"
              >
                Explore features
              </Link>
            </div>

            {!user && authError && (
              <p
                className="mx-auto mt-4 w-fit max-w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
                role="alert"
              >
                {authError === "Network Error"
                  ? "We couldn’t reach the server. Please try again in a moment."
                  : authError}
              </p>
            )}

            {/* Small trust text */}

            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-(--text-muted)">
              <span>✓ Easy to use</span>
              <span>✓ Flexible access</span>
              <span>✓ Scalable</span>
            </div>
          </div>
        </section>

        <section className="border-y border-(--border) bg-(--primary-soft-hover)/20 px-4 py-8 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-3">
            {[
              {
                icon: UsersRound,
                title: "People in one place",
                text: "Keep student and staff information organized.",
              },
              {
                icon: CalendarCheck2,
                title: "Everyday workflows",
                text: "Coordinate attendance, leave, and school operations.",
              },
              {
                icon: BookOpenCheck,
                title: "Academic and fee records",
                text: "Connect assessments, classes, accounts, and payments.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-(--border) bg-(--surface)/80 p-4"
              >
                <span className="rounded-xl bg-(--primary-soft) p-2.5 text-(--primary)">
                  <Icon size={19} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-(--text)">{title}</h2>
                  <p className="mt-1 text-xs leading-5 text-(--text-secondary)">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 text-center">
            <NavLink
              to="/features"
              className="inline-flex items-center gap-2 text-sm font-semibold text-(--primary) hover:underline"
            >
              See how the platform works <ArrowRight size={16} />
            </NavLink>
          </div>
        </section>

        <section
          id="schools"
          className="scroll-mt-28 border-t border-(--border) px-4 py-12 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-(--primary)">
                School directory
              </p>
              <h2 className="mt-2 text-3xl font-bold">Find your school</h2>
              <p className="mt-2 text-sm text-(--text-secondary)">
                Search by school name, city, state or board to see its profile,
                facilities, admissions and student services.
              </p>
              <label className="relative mt-6 block text-left">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)"
                />
                <Input
                  value={schoolSearch}
                  onChange={(event) => setSchoolSearch(event.target.value)}
                  placeholder="Search schools, cities or boards"
                  className="w-full rounded-2xl border border-(--border) bg-(--primary-soft-hover) py-3.5 pl-12 pr-4 text-sm outline-none focus:border-(--primary)"
                />
              </label>
            </div>

            {schoolError && (
              <p
                role="alert"
                className="mx-auto mt-6 max-w-3xl rounded-xl bg-red-500/10 p-4 text-sm text-red-700"
              >
                {schoolError}
              </p>
            )}
            {schoolError ? null : schoolsLoading ? (
              <p className="py-10 text-center text-sm text-(--text-muted)">
                Searching schools…
              </p>
            ) : schools.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {schools.map((school) => (
                  <Link
                    key={school._id}
                    to={`/schools/${encodeURIComponent(school.slug)}`}
                    className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5 transition hover:-translate-y-1 hover:border-(--primary)"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-(--text)">
                          {school.schoolName}
                        </h3>
                        <p className="mt-1 text-sm text-(--text-muted)">
                          {[school.city, school.state, school.board]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--primary-soft) text-(--primary)">
                        <UsersRound size={19} />
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-(--text-secondary)">
                      {school.staffCount} staff · {school.teacherCount} teachers
                      · {school.classCount} classes
                    </p>
                    {school.facilities?.length > 0 && (
                      <p className="mt-3 line-clamp-2 text-xs text-(--text-muted)">
                        Facilities: {school.facilities.slice(0, 3).join(", ")}
                        {school.facilities.length > 3
                          ? ` +${school.facilities.length - 3} more`
                          : ""}
                      </p>
                    )}
                    <span className="mt-4 inline-flex text-sm font-semibold text-(--primary)">
                      View school profile →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-(--text-muted)">
                No schools matched that search.
              </p>
            )}
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

        {/* {openOrganisation && (
          <Organisation
            organisation={openOrganisation}
            setOrganisation={setOpenOrganisation}
          />
        )} */}
      </div>
    </main>
  );
};

export default Home;

export const Organisation = ({ organisation, setOrganisation }) => {
  const navigate = useNavigate();
  return (
    <section
      className="fixed grid place-items-center inset-0 z-50 bg-slate-800/50 backdrop-blur-md p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOrganisation(false);
      }}
    >
      <div
        className="relative w-full max-w-2xl p-6 rounded-2xl border bg-(--primary-soft-hover) text-(--text-primary) border-(--border) shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close the organisation"
          onClick={() => setOrganisation(false)}
          className="absolute size-8 right-4 top-4 grid place-items-center rounded-lg text-(--text-secondary) hover:bg-(--warning) overflow-y-auto"
        >
          <X size={17} />
        </button>
        <span className="text-[10px] font-bold tracking-[0.18em] text-(--primary)">
          ORGANISATION TYPE
        </span>
        <h2 className="mt-2 text-xl font-bold">
          Choose your organisation type
        </h2>
        <p className="mt-2 text-xs leading-5 text-(--text-secondary)">
          Select a organisation type for your workspace.
        </p>
        <div className="mt-5 pt-3 grid max-h-[60vh] gap-3 sm:grid-cols-2 overflow-y-auto overscroll-contain scrollbar-none">
          {managementTypes.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.route);
                }}
                className="group rounded-2xl border-2 border-(--border)  p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-(--primary) hover:shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--primary-soft) text-(--primary)">
                    <Icon size={24} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>

                <h3 className="text-lg font-bold text-(--text)">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-4 text-(--text-secondary)">
                  {item.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.features.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className="rounded-lg bg-(--bg-secondary) px-2.5 py-1 text-xs text-(--text-secondary)"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
