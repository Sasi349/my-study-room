"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"credentials" | "passcode">("passcode");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passcode, setPasscode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password");
      setLoading(false);
    } else {
      router.push("/categories");
      router.refresh();
    }
  }

  async function handlePasscodeSubmit(code: string) {
    setError("");
    setLoading(true);

    const result = await signIn("passcode", {
      passcode: code,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid passcode");
      setPasscode(["", "", "", ""]);
      pinRefs[0].current?.focus();
      setLoading(false);
    } else {
      router.push("/categories");
      router.refresh();
    }
  }

  function handlePinChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newPasscode = [...passcode];
    newPasscode[index] = value.slice(-1);
    setPasscode(newPasscode);
    setError("");

    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const code = newPasscode.join("");
      if (code.length === 4) {
        handlePasscodeSubmit(code);
      }
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  }

  function handlePinPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const newPasscode = pasted.split("");
      setPasscode(newPasscode);
      pinRefs[3].current?.focus();
      handlePasscodeSubmit(pasted);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 dark:from-blue-950/30 via-white dark:via-slate-950 to-slate-50 dark:to-slate-950">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <Image src="/icon.png" alt="My Study Room" width={80} height={80} className="rounded-full object-cover shadow-lg shadow-blue-200 dark:shadow-blue-950/20 mx-auto mb-5" priority />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">My Study Room</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Sign in to access your knowledge base</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setMode("passcode"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === "passcode"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <KeyRound size={14} />
            Passcode
          </button>
          <button
            onClick={() => { setMode("credentials"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === "credentials"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <User size={14} />
            Username
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl p-3.5 ring-1 ring-red-100 dark:ring-red-900/30 flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}

        {/* Passcode Mode */}
        {mode === "passcode" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-950/20 ring-1 ring-slate-200/60 dark:ring-slate-700/60 p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">Enter your 4-digit passcode</p>
            <div className="flex justify-center gap-3 mb-4">
              {passcode.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  onPaste={i === 0 ? handlePinPaste : undefined}
                  disabled={loading}
                  autoFocus={i === 0}
                  className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              ))}
            </div>
            {loading && (
              <div className="flex justify-center">
                <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Credentials Mode */}
        {mode === "credentials" && (
          <form onSubmit={handleCredentialsSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-950/20 ring-1 ring-slate-200/60 dark:ring-slate-700/60 p-6 space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <User size={16} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-10 pr-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors"
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pl-10 pr-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
