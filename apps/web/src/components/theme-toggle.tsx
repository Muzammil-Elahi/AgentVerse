"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "renewal-desk-theme";

export function ThemeToggle() {
  // Unknown until mount: the class was already set by the blocking script in
  // layout.tsx, and we only need to read it back for the label and icon.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private browsing or blocked storage — the toggle still works this visit.
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      className="ck-theme-toggle"
      onClick={toggle}
      aria-pressed={dark ?? undefined}
    >
      <span aria-hidden="true" className="ck-theme-toggle-icon">
        {dark ? "☾" : "☀"}
      </span>
      {dark === null ? "Theme" : dark ? "Night desk" : "Day desk"}
    </button>
  );
}
