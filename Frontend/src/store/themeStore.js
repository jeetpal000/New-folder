import {create} from "zustand";

const themeKey = "nova-theme-color";
const availableThemes = ["blue", "pink", "yellow", "green", "purple", "dark"];

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(themeKey);
  return availableThemes.includes(savedTheme) ? savedTheme : "blue";
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.setAttribute("data-theme-color", theme);
  root.classList.toggle("dark", theme === "dark");
};

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  themes: availableThemes,

  setTheme: (nextTheme) => {
    if (!availableThemes.includes(nextTheme)) return;

    applyTheme(nextTheme);
    localStorage.setItem(themeKey, nextTheme);
    set({ theme: nextTheme });
  },
}));