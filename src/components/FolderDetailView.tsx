"use client";

import React, { useState, useRef, useEffect } from "react";
import { Folder, Topic } from "@/types";
import { formatDisplayDate } from "@/lib/date-utils";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock,
  Folder as FolderIcon,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface FolderDetailViewProps {
  folder: Folder;
  topics: Topic[];
  todayStr: string;
  onBack: () => void;
  onMarkRevised: (topic: Topic) => void;
  onOpenAddTopic: (folderId: string) => void;
  onOpenRenameTopic: (topic: Topic) => void;
  onOpenDeleteTopic: (topic: Topic) => void;
}

export default function FolderDetailView({
  folder,
  topics,
  todayStr,
  onBack,
  onMarkRevised,
  onOpenAddTopic,
  onOpenRenameTopic,
  onOpenDeleteTopic,
}: FolderDetailViewProps) {
  const [activeTopicMenuId, setActiveTopicMenuId] = useState<string | null>(null);
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const folderTopics = topics.filter((t) => t.folder_id === folder.id);
  const topicsDueToday = folderTopics.filter((t) => t.next_revision_date <= todayStr);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveTopicMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRevise = async (topic: Topic) => {
    setRevisingId(topic.id);
    try {
      await onMarkRevised(topic);
    } finally {
      setRevisingId(null);
    }
  };

  return (
    <div className="space-y-8" ref={containerRef}>
      {/* Navigation & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs sm:text-sm shadow-sm"
            aria-label="Back to folders"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {folder.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {folderTopics.length} total {folderTopics.length === 1 ? "topic" : "topics"}
              </p>
            </div>
          </div>
        </div>

        {/* Plus icon to add new topic to this folder */}
        <button
          onClick={() => onOpenAddTopic(folder.id)}
          aria-label="Add Topic"
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Topic</span>
        </button>
      </div>

      {/* 1. Topics to be revised today in this folder */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Topics to Revise Today</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              {topicsDueToday.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled for revision today in this folder</p>
        </div>

        {topicsDueToday.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center shadow-sm">
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No topics due for revision today in this folder!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topicsDueToday.map((topic) => {
              const isOverdue = topic.next_revision_date < todayStr;
              const dateLabel = formatDisplayDate(topic.next_revision_date, todayStr);
              const isRevising = revisingId === topic.id;

              return (
                <div
                  key={topic.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Revision #{topic.revision_count + 1}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isOverdue
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20"
                            : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{dateLabel}</span>
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white break-words">
                      {topic.title}
                    </h4>
                  </div>

                  <button
                    onClick={() => handleRevise(topic)}
                    disabled={isRevising}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isRevising ? "Updating..." : "Mark Revised"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Below topics to be revised section: All topics in this folder */}
      <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>All Topics in this Folder</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {folderTopics.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Every topic created inside {folder.name}</p>
          </div>

          <button
            onClick={() => onOpenAddTopic(folder.id)}
            aria-label="Add topic"
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Topic</span>
          </button>
        </div>

        {folderTopics.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center shadow-sm">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No topics added yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mb-3">
              Add topics you want to revise systematically using spaced intervals.
            </p>
            <button
              onClick={() => onOpenAddTopic(folder.id)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topic</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {folderTopics.map((topic) => {
              const isDue = topic.next_revision_date <= todayStr;
              const dateLabel = formatDisplayDate(topic.next_revision_date, todayStr);
              const isMenuOpen = activeTopicMenuId === topic.id;
              const isRevising = revisingId === topic.id;

              return (
                <div
                  key={topic.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between gap-3 group shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white break-words">
                        {topic.title}
                      </h4>
                      {isDue && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                          Due
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>Next: {dateLabel}</span>
                      </span>
                      <span>•</span>
                      <span>Revised: {topic.revision_count} times</span>
                    </div>
                  </div>

                  {/* Actions: Mark Revised if due, and 3-dots Menu */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isDue && (
                      <button
                        onClick={() => handleRevise(topic)}
                        disabled={isRevising}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Mark Revised"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isRevising ? "..." : "Revise"}</span>
                      </button>
                    )}

                    {/* 3-dots Menu for individual topic */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveTopicMenuId(isMenuOpen ? null : topic.id)
                        }
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        aria-label="Topic options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              setActiveTopicMenuId(null);
                              onOpenRenameTopic(topic);
                            }}
                            className="w-full px-3 py-2 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            <span>Edit Topic</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTopicMenuId(null);
                              onOpenDeleteTopic(topic);
                            }}
                            className="w-full px-3 py-2 text-left text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
