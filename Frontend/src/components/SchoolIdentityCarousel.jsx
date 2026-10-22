import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, School } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const SchoolIdentityCarousel = () => {
  const school = useAuthStore((state) => state.user?.schoolId);
  const schoolName = school?.schoolName || "Your school";
  const slides = [
    school?.logo,
    ...(school?.publicHighlights || []).map((item) => item.imageUrl),
  ].filter(
    (imageUrl) => typeof imageUrl === "string" && /^https:\/\//i.test(imageUrl),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setImageFailed(false);
  }, [activeIndex]);

  const moveSlide = (direction) => {
    setActiveIndex(
      (index) => (index + direction + slides.length) % slides.length,
    );
  };

  return (
    <section
      aria-label={`${schoolName} school identity`}
      className="relative isolate flex min-h-52 items-end overflow-hidden rounded-3xl border border-(--border) bg-linear-to-tl from-(--card-gradient-1)/70 via-(--card-gradient-2) to-(--card-gradient-1)/70 p-6 text-white shadow-xl sm:min-h-64 sm:p-9"
    >
      {slides.length > 0 && !imageFailed && (
        <img
          key={slides[activeIndex]}
          src={slides[activeIndex]}
          alt={`${schoolName} campus`}
          onError={() => setImageFailed(true)}
          className="absolute inset-0 -z-20 size-full object-cover"
        />
      )}
      {/* <div className="absolute inset-0 -z-10 bg-linear-to-r from-slate-950/85 via-slate-950/55 to-slate-950/10" /> */}

      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-black/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur">
          <School size={15} />
          School workspace
        </span>
        <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
          {schoolName}
        </h2>
        <p className="mt-2 text-sm text-white/85 sm:text-base">
          You are signed in to your school’s management workspace.
        </p>
        {(school?.city || school?.state) && (
          <p className="mt-2 text-sm text-white/75">
            {[school.city, school.state].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-5 right-5 flex items-center gap-2 sm:bottom-7 sm:right-7">
          <button
            type="button"
            aria-label="Previous school image"
            onClick={() => moveSlide(-1)}
            className="grid size-9 place-items-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur transition hover:bg-black/45"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-10 text-center text-xs font-semibold text-white">
            {activeIndex + 1} / {slides.length}
          </span>
          <button
            type="button"
            aria-label="Next school image"
            onClick={() => moveSlide(1)}
            className="grid size-9 place-items-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur transition hover:bg-black/45"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
};

export default SchoolIdentityCarousel;
