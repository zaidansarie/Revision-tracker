"use client";

import React, { useState, useEffect } from "react";
import { Folder, Topic, UserSettings } from "@/types";
import {
  Settings as SettingsIcon,
  X,
  Plus,
  Trash2,
  RotateCw,
  Check,
  Sun,
  Moon,
  Download,
  FileSpreadsheet,
  FileJson,
  Bell,
  BellRing,
} from "lucide-react";
import { exportToJSON, exportToCSV } from "@/lib/export";
import {
  isNotificationSupported,
  getNotificationPermission,
  areNotificationsEnabled,
  setNotificationsEnabled,
  getReminderTime,
  setReminderTime,
  requestNotificationPermission,
  sendTestNotification,
} from "@/lib/notifications";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  folders: Folder[];
  topics: Topic[];
  onSave: (intervals: number[], theme: "dark" | "light") => Promise<void>;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  folders,
  topics,
  onSave,
}: SettingsModalProps) {
  const [intervals, setIntervals] = useState<number[]>(settings.intervals);
  const [theme, setTheme] = useState<"dark" | "light">(settings.theme || "dark");
  const [isSaving, setIsSaving] = useState(false);
  const [newDays, setNewDays] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Notification state
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [notifEnabled, setNotifEnabledState] = useState(false);
  const [reminderTime, setReminderTimeState] = useState("08:00");
  const [testNotifSent, setTestNotifSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIntervals(settings.intervals);
      setTheme(settings.theme || "dark");
      setNotifSupported(isNotificationSupported());
      setNotifPermission(getNotificationPermission());
      setNotifEnabledState(areNotificationsEnabled());
      setReminderTimeState(getReminderTime());
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleToggleNotifications = async () => {
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      setNotifPermission(getNotificationPermission());
      setNotifEnabledState(granted);
    } else {
      setNotificationsEnabled(false);
      setNotifEnabledState(false);
    }
  };

  const handleReminderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReminderTimeState(val);
    setReminderTime(val);
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 2000);
  };

  const handleAddInterval = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(newDays.trim(), 10);
    if (!isNaN(val) && val > 0) {
      setIntervals([...intervals, val]);
      setNewDays("");
    }
  };

  const handleRemoveInterval = (index: number) => {
    if (intervals.length <= 1) return;
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  const handleUpdateInterval = (index: number, val: number) => {
    if (val <= 0) return;
    const copy = [...intervals];
    copy[index] = val;
    setIntervals(copy);
  };

  const handleSave = async () => {
    if (intervals.length === 0) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSave(intervals, theme);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 500);
    } finally {
      setIsSaving(false);
    }
  };

  const lastDay = intervals.length > 0 ? intervals[intervals.length - 1] : 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure intervals, display theme, backups & alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* 1. Theme Option */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Theme Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition ${
                  theme === "light"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sun className={`w-4 h-4 ${theme === "light" ? "text-amber-500" : ""}`} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition ${
                  theme === "dark"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Moon className={`w-4 h-4 ${theme === "dark" ? "text-indigo-400" : ""}`} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* 2. Revision Intervals */}
          <div className="pt-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-semibold text-indigo-800 dark:text-indigo-300">How intervals work:</p>
              <p className="text-slate-700 dark:text-slate-300">
                Specify the interval (in days) for each revision step. Once the final step ({lastDay} days) is completed, it will automatically repeat every {lastDay} days.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Revision Schedule (In Days)
              </label>

              <div className="space-y-2">
                {intervals.map((day, idx) => {
                  const isLast = idx === intervals.length - 1;

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-20 flex-shrink-0">
                        Step {idx + 1}:
                      </span>

                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          min="1"
                          value={day}
                          onChange={(e) =>
                            handleUpdateInterval(idx, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {day === 1 ? "day later" : "days later"}
                        </span>
                      </div>

                      {isLast && intervals.length > 1 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1">
                          <RotateCw className="w-3 h-3" />
                          Repeats
                        </span>
                      )}

                      {intervals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInterval(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                          title="Remove step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Interval Form */}
              <form onSubmit={handleAddInterval} className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  value={newDays}
                  onChange={(e) => setNewDays(e.target.value)}
                  placeholder="e.g. 60"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newDays}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              </form>
            </div>
          </div>

          {/* 3. Push / PWA Morning Notifications */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <span>Morning Revision Reminders</span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Get notified on your phone or laptop when topics are due
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  notifEnabled
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {notifEnabled ? "Enabled" : "Enable"}
              </button>
            </div>

            {notifEnabled && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">Preferred Reminder Time</span>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={handleReminderTimeChange}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test notification on this device:
                  </span>
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-600/30 transition flex items-center gap-1.5"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>{testNotifSent ? "Sent!" : "Send Test"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Export & Backup Section */}
          <div className="pt-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-500" />
                <span>Export & Backup</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download an offline backup of all your folders and topics
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => exportToJSON(folders, topics, settings)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition flex items-center gap-3 text-left group"
              >
                <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <FileJson className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    Export JSON
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Complete raw backup</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => exportToCSV(folders, topics)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition flex items-center gap-3 text-left group"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    Export CSV
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Spreadsheet format</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : isSaving ? (
              "Saving..."
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
