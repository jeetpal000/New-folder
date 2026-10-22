import { Check, Palette, X } from "lucide-react";
import { useState } from "react";
import { useThemeStore } from "../store/themeStore";

export const themes = [
  { id: "blue", title: "Blue", text: "Focused and calm", swatch: "#2563eb" },
  { id: "pink", title: "Pink", text: "Warm and expressive", swatch: "#db2777" },
  {
    id: "yellow",
    title: "Yellow",
    text: "Bright and energetic",
    swatch: "#d97706",
  },
  {
    id: "green",
    title: "Green",
    text: "Fresh and balanced",
    swatch: "#16a34a",
  },
  {
    id: "purple",
    title: "Purple",
    text: "Creative and bold",
    swatch: "#7c3aed",
  },
  { id: "dark", title: "Dark", text: "Easy on the eyes", swatch: "#60a5fa" },
];

export const ThemeButton = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
  };

  return (
    <>
      <div className="relative group">
        <button
          type="button"
          aria-label="Open theme picker"
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center rounded-md border border-(--border) bg-(--surface) text-(--text-secondary) transition-all duration-300 hover:border-(--primary) hover:text-(--primary) cursor-pointer"
        >
          <Palette size={17} />
        </button>
        <span className="pointer-events-none absolute -left-8 -translatex-1/2 top-full mt-2 whitespace-nowrap rounded-lg bg-(--surface) px-3 py-1.5 text-xs text-(--text) opacity-0 invisible translate-y-2 -translate-x-4 group-hover:shadow-[0_8px_20px_var(--shadow-xl)] transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0">
          Switch Theme
        </span>
      </div>

      {open && (
        <div
          className="fixed w-screen h-screen inset-0 left-1/2 -top-4  -translate-x-1/2 z-9999 grid place-items-center bg-slate-950/50 backdrop-blur-2xl p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-picker-title"
            className="relative w-full max-w-sm rounded-2xl border border-(--border) bg-(--primary-soft-hover) p-6 text-(--text-primary) shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close theme picker"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-(--text-secondary) hover:bg-(--surface-hover)"
            >
              <X size={17} />
            </button>
            <span className="text-[10px] font-bold tracking-[.18em] text-(--primary)">
              APPEARANCE
            </span>
            <h2 id="theme-picker-title" className="mt-2 text-xl font-bold">
              Choose your theme
            </h2>
            <p className="mt-2 text-xs leading-5 text-(--text-secondary)">
              Select a color system for your workspace.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {themes.map((item) => (
                <ThemeOption
                  key={item.id}
                  active={theme === item.id}
                  title={item.title}
                  text={item.text}
                  swatch={item.swatch}
                  onClick={() => changeTheme(item.id)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export const ThemeOption = ({ active, title, text, swatch, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative rounded-xl border p-4 text-left transition ${active ? "border-(--primary) bg-blue-50 dark:bg-blue-950/40" : "border-(--border) hover:border-(--primary)"}`}
  >
    <span className="grid size-9 place-items-center rounded-lg bg-(--background)/20 backdrop-blur-xl">
      <i className="size-4 rounded-full" style={{ backgroundColor: swatch }} />
    </span>
    <strong className="mt-3 block text-sm">{title}</strong>
    <small className="mt-1 block text-[10px] text-(--text-secondary)">
      {text}
    </small>
    {active && (
      <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-(--primary) text-white">
        <Check size={12} />
      </span>
    )}
  </button>
);

export const Label = ({ children, htmlFor, required = false }) => {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-(--text)"
    >
      {children}
      {required && <span className="ml-1 text-(--danger)">*</span>}
    </label>
  );
};

export const Input = ({
  id,
  name,
  type = "text",
  className = "",
  ...props
}) => {
  return (
    <input
      id={id}
      name={name || id}
      type={type}
      className={`
    w-full
    h-11
    px-4
    rounded-lg
    text-(--text)
    placeholder:text-(--text-muted)
    border
    border-(--border)
    outline-none
    shadow-[0_4px_12px_var(--shadow-lg)]
    transition-all
    duration-300
    ease-out
    hover:border-(--primary)
    hover:shadow-[0_6px_20px_var(--bg-hover)]
    focus:border-(--primary)
    focus:ring-1
    focus:ring-(--primary)/50
    focus:shadow-[0px_6px_20px_var(--primary)]
    disabled:cursor-not-allowed
    disabled:opacity-70
    disabled:bg-(--background-secondary)
  ${className}`}
      {...props}
    />
  );
};

export const Select = ({ id, name, className = "", children, ...props }) => {
  return (
    <select
      id={id}
      name={name || id}
      className={`
        w-full
        h-11
        px-4
        rounded-lg
        text-(--text)
        border
        border-(--border)
        outline-none
        shadow-[0_4px_12px_var(--shadow-lg)]
        transition-all
        duration-300
        ease-out
        hover:border-(--primary)
        hover:shadow-[0_6px_20px_var(--bg-hover)]
        focus:border-(--primary)
        focus:ring-1
        focus:ring-(--primary)/50
        focus:shadow-[0px_6px_20px_var(--primary)]
        disabled:cursor-not-allowed
        disabled:opacity-70
        disabled:bg-(--background-secondary)
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  );
};

export const Textarea = ({ id, name, rows = 4, className = "", ...props }) => {
  return (
    <textarea
      id={id}
      name={name || id}
      rows={rows}
      className={`
        w-full
        min-h-28
        px-4
        py-3
        rounded-lg
        text-(--text)
        placeholder:text-(--text-muted)
        border
        border-(--border)
        outline-none
        resize-y
        shadow-[0_4px_12px_var(--shadow-lg)]
        transition-all
        duration-300
        ease-out
        hover:border-(--primary)
        hover:shadow-[0_6px_20px_var(--bg-hover)]
        focus:border-(--primary)
        focus:ring-1
        focus:ring-(--primary)/50
        focus:shadow-[0px_6px_20px_var(--primary)]
        disabled:cursor-not-allowed
        disabled:opacity-70
        disabled:bg-(--background-secondary)
        ${className}
      `}
      {...props}
    />
  );
};
