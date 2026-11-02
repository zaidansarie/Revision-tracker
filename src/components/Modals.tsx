"use client";

import React, { useState, useEffect } from "react";
import { Folder, Topic } from "@/types";
import { X, FolderPlus, Edit2, Trash2, Plus, AlertTriangle, Calendar } from "lucide-react";
import { getTodayDateString, addDays, formatDisplayDate } from "@/lib/date-utils";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function BaseModal({ isOpen, onClose, children }: BaseModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 transition-colors">
        {children}
      </div>
    </div>
  );
}

// 1. Create Folder Modal
export function CreateFolderModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setName("");
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">New Folder</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Physics, Operating Systems, Spanish"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Folder"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 2. Rename Folder Modal
export function RenameFolderModal({
  folder,
  isOpen,
  onClose,
  onSubmit,
}: {
  folder: Folder | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderId: string, newName: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (folder) setName(folder.name);
  }, [folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folder || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(folder.id, name.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Edit2 className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Rename Folder</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 3. Delete Folder Modal
export function DeleteFolderModal({
  folder,
  isOpen,
  onClose,
  onSubmit,
}: {
  folder: Folder | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderId: string) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!folder) return;
    setIsSubmitting(true);
    try {
      await onSubmit(folder.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Folder</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{folder?.name}"</span>?
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>All topics inside this folder will also be permanently deleted.</span>
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-md shadow-rose-600/30 disabled:opacity-50"
        >
          {isSubmitting ? "Deleting..." : "Delete Folder"}
        </button>
      </div>
    </BaseModal>
  );
}

// 4. Add Topic Modal
export function AddTopicModal({
  folder,
  firstIntervalDays,
  isOpen,
  onClose,
  onSubmit,
}: {
  folder: Folder | null;
  firstIntervalDays: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, folderId: string, studiedDate: string) => Promise<void>;
}) {
  const todayStr = getTodayDateString();
  const [title, setTitle] = useState("");
  const [studiedDate, setStudiedDate] = useState<string>(todayStr);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setStudiedDate(getTodayDateString());
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folder || !title.trim()) return;
    const finalDate = studiedDate && studiedDate <= todayStr ? studiedDate : todayStr;
    setIsSubmitting(true);
    try {
      await onSubmit(title.trim(), folder.id, finalDate);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeStudiedDate = studiedDate && studiedDate <= todayStr ? studiedDate : todayStr;
  const computedNextDate = addDays(safeStudiedDate, firstIntervalDays);
  const displayScheduled = formatDisplayDate(computedNextDate);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Add New Topic</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">In folder: {folder?.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Topic Title
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Newton's 2nd Law, Memory Hierarchy"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Date Studied</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                (Up to today)
              </span>
            </label>
            <input
              type="date"
              max={todayStr}
              value={studiedDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val && val > todayStr) {
                  setStudiedDate(todayStr);
                } else {
                  setStudiedDate(val);
                }
              }}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
            Initial revision will be scheduled for{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-300">
              {displayScheduled}
            </span>{" "}
            ({firstIntervalDays === 1 ? "1 day" : `${firstIntervalDays} days`} after studied date).
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !studiedDate || isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add Topic"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 5. Edit Topic Modal (Rename title & Edit studied date)
export function EditTopicModal({
  topic,
  currentIntervalDays,
  isOpen,
  onClose,
  onSubmit,
}: {
  topic: Topic | null;
  currentIntervalDays: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topicId: string, newTitle: string, newStudiedDate: string) => Promise<void>;
}) {
  const todayStr = getTodayDateString();
  const [title, setTitle] = useState("");
  const [studiedDate, setStudiedDate] = useState<string>(todayStr);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (topic) {
      setTitle(topic.title);
      const initialDate =
        topic.studied_date ||
        (topic.created_at ? topic.created_at.split("T")[0] : todayStr);
      setStudiedDate(initialDate <= todayStr ? initialDate : todayStr);
    }
  }, [topic, todayStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !title.trim()) return;
    const finalDate = studiedDate && studiedDate <= todayStr ? studiedDate : todayStr;
    setIsSubmitting(true);
    try {
      await onSubmit(topic.id, title.trim(), finalDate);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeStudiedDate = studiedDate && studiedDate <= todayStr ? studiedDate : todayStr;
  const computedNextDate = addDays(safeStudiedDate, currentIntervalDays);
  const displayScheduled = formatDisplayDate(computedNextDate);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Edit2 className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Edit Topic</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Topic Title
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Date Studied</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                (Up to today)
              </span>
            </label>
            <input
              type="date"
              max={todayStr}
              value={studiedDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val && val > todayStr) {
                  setStudiedDate(todayStr);
                } else {
                  setStudiedDate(val);
                }
              }}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
            Next revision will be rescheduled to{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-300">
              {displayScheduled}
            </span>{" "}
            ({currentIntervalDays === 1 ? "1 day" : `${currentIntervalDays} days`} after studied date).
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !studiedDate || isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// Keep export for backwards compatibility
export const RenameTopicModal = EditTopicModal;

// 6. Delete Topic Modal
export function DeleteTopicModal({
  topic,
  isOpen,
  onClose,
  onSubmit,
}: {
  topic: Topic | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topicId: string) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!topic) return;
    setIsSubmitting(true);
    try {
      await onSubmit(topic.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Topic</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{topic?.title}"</span>?
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-md shadow-rose-600/30 disabled:opacity-50"
        >
          {isSubmitting ? "Deleting..." : "Delete Topic"}
        </button>
      </div>
    </BaseModal>
  );
}
