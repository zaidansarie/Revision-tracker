"use client";

import React, { useState } from "react";
import { Topic, Folder } from "@/types";
import { formatDisplayDate } from "@/lib/date-utils";
import { CheckCircle2, Clock, Folder as FolderIcon, Sparkles } from "lucide-react";

interface TopicsDueTodayProps {
  topics: Topic[];
  folders: Folder[];
  todayStr: string;
  onMarkRevised: (topic: Topic) => void;
}

export default function TopicsDueToday({
  topics,
  folders,
  todayStr,
  onMarkRevised,
}: TopicsDueTodayProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [revisingId, setRevisingId] = useState<string | null>(null);

  // Map folder id to name
  const folderMap = new Map<string, string>();
  folders.forEach((f) => folderMap.set(f.id, f.name));

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    if (selectedFolderId === "all") return true;
    return t.folder_id === selectedFolderId;
  });

  const handleRevise = async (topic: Topic) => {
    setRevisingId(topic.id);
    try {
      await onMarkRevised(topic);
    } finally {
      setRevisingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>Topics to Revise Today</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {filteredTopics.length}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Review and check off items scheduled for today
          </p>
        </div>
      </div>

      {/* Filter Tabs: "All" or folder-wise */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs sm:text-sm">
        <button
          onClick={() => setSelectedFolderId("all")}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
            selectedFolderId === "all"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <span>All</span>
          <span
            className={`text-xs px-1.5 py-0.2 rounded-md ${
              selectedFolderId === "all" ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {topics.length}
          </span>
        </button>

        {folders.map((folder) => {
          const countInFolder = topics.filter((t) => t.folder_id === folder.id).length;
          const isSelected = selectedFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <FolderIcon className="w-3.5 h-3.5" />
              <span>{folder.name}</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-md ${
                  isSelected ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {countInFolder}
              </span>
            </button>
          );
        })}
      </div>

      {/* List of topics */}
      {filteredTopics.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No revisions due today</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
            {selectedFolderId === "all"
              ? "Great job! All your topics are up to date for today."
              : "No topics due for revision in this folder today."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredTopics.map((topic) => {
            const isOverdue = topic.next_revision_date < todayStr;
            const dateLabel = formatDisplayDate(topic.next_revision_date, todayStr);
            const folderName = folderMap.get(topic.folder_id) || "General";
            const isRevising = revisingId === topic.id;

            return (
              <div
                key={topic.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-sm group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700/60 max-w-[180px] truncate">
                      <FolderIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{folderName}</span>
                    </span>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isOverdue
                          ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{dateLabel}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-white transition break-words">
                    {topic.title}
                  </h3>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Revision #{topic.revision_count + 1}</span>
                    <span>•</span>
                    <span>Stage {topic.current_interval_index + 1}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRevise(topic)}
                  disabled={isRevising}
                  className="w-full mt-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
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
  );
}
