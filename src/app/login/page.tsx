"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { checkCredentials, setClientSession } from "@/lib/auth";
import { Lock, User, AlertCircle, BookOpen, KeyRound, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      setIsLoading(false);
      return;
    }

    if (checkCredentials(username, password)) {
      setClientSession(username.trim());
      router.push("/");
      router.refresh();
    } else {
      setError("Invalid username or password.");
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername("user");
    setPassword("user2467::");
    setError(null);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 transition-colors">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            ZaidRev
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Personal Revision Tracker</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Log In"}
          </button>
        </form>

        {/* Demo Credentials Box for Resume Reviewers */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3.5 bg-indigo-50/60 dark:bg-slate-950/60 border border-indigo-100 dark:border-slate-800 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Resume & Visitor Demo Account</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
              <span>User: <strong className="text-indigo-600 dark:text-indigo-400">user</strong></span>
              <span>•</span>
              <span>Pass: <strong className="text-indigo-600 dark:text-indigo-400">user2467::</strong></span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>One-Click Fill Demo Credentials</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
