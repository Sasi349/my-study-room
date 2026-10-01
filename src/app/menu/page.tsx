"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ScrollText, type LucideIcon } from "lucide-react";
import Header from "@/components/ui/Header";
import BottomNav from "@/components/ui/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TOTAL_ARTICLES } from "@/lib/constitution-articles";

interface MenuOption {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    href: "/menu/articles",
    title: "Articles",
    description: "இந்திய அரசியலமைப்பு சரத்துகள்",
    icon: ScrollText,
    gradient: "from-indigo-500 to-blue-600",
  },
];

export default function MenuPage() {
  const [articleMembers, setArticleMembers] = useState<{ id: string; name: string; completed: string[] }[] | null>(null);

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setArticleMembers(data.members))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title="Menu" />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MENU_OPTIONS.map((option, i) => {
            const isArticles = option.href === "/menu/articles";
            return (
              <Link key={option.href} href={option.href} className="block animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <Card className="gap-3 rounded-2xl border-0 py-4 ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:shadow-lg dark:hover:shadow-slate-950/30 active:scale-[0.98] transition-all duration-200">
                  <CardHeader className="flex items-center gap-3 px-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${option.gradient} shadow-md shadow-indigo-200 dark:shadow-indigo-950/20 flex items-center justify-center text-white shrink-0`}>
                      <option.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{option.title}</CardTitle>
                      <CardDescription className="mt-1 truncate text-xs">{option.description}</CardDescription>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  </CardHeader>
                  {isArticles && articleMembers !== null && (
                    <CardContent className="px-4 space-y-2.5">
                      {articleMembers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Add members to start tracking progress</p>
                      ) : (
                        articleMembers.map((member) => {
                          const percent = Math.round((member.completed.length / TOTAL_ARTICLES) * 100);
                          return (
                            <div key={member.id}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{member.name}</span>
                                <span className="text-muted-foreground shrink-0">
                                  {member.completed.length} / {TOTAL_ARTICLES}
                                  <span className="ml-1.5 font-semibold text-emerald-600 dark:text-emerald-400">{percent}%</span>
                                </span>
                              </div>
                              <Progress value={percent} className="h-1.5" />
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
