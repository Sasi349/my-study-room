"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, ClipboardCheck } from "lucide-react";

const tabs = [
  { href: "/categories", label: "Home", icon: Home },
  { href: "/tracker", label: "Tracker", icon: ClipboardCheck },
  { href: "/time-tracker", label: "Time Tracker", icon: Clock },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-4xl mx-auto flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-semibold ${isActive ? "font-bold" : ""}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
