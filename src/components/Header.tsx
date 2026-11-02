"use client";

import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Menu, Settings as SettingsIcon, LogOut, Calendar } from "lucide-react";
import { clearClientSession } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onOpenSettings: () => void;
  currentDateFormatted: string;
}

export default function Header({ onOpenSettings, currentDateFormatted }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearClientSession();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              ZaidRev
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Menu button & dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-slate-200 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
              >
                <SettingsIcon className="w-4 h-4 text-indigo-400" />
                <span>Settings</span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
