"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-xl p-2 w-[34px] h-[34px]" />
    );
  }

  function cycleTheme() {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  }

  const icon =
    theme === "light" ? <Sun size={18} /> :
    theme === "dark" ? <Moon size={18} /> :
    <Monitor size={18} />;

  const label =
    theme === "light" ? "Light mode" :
    theme === "dark" ? "Dark mode" :
    "System theme";

  return (
    <button
      onClick={cycleTheme}
      className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 transition-colors"
      title={label}
    >
      {icon}
    </button>
  );
}
