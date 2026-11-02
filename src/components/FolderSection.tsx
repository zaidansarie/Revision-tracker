"use client";

import React, { useState, useRef, useEffect } from "react";
import { Folder, Topic } from "@/types";
import { Folder as FolderIcon, MoreVertical, Plus, Edit2, Trash2 } from "lucide-react";

interface FolderSectionProps {
  folders: Folder[];
  topics: Topic[];
  onSelectFolder: (folder: Folder) => void;
  onOpenCreateFolder: () => void;
  onOpenRenameFolder: (folder: Folder) => void;
  onOpenDeleteFolder: (folder: Folder) => void;
}

export default function FolderSection({
  folders,
  topics,
  onSelectFolder,
  onOpenCreateFolder,
  onOpenRenameFolder,
  onOpenDeleteFolder,
}: FolderSectionProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="space-y-4" ref={menuContainerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Folders</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {folders.length}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Organize your revision subjects and topics
          </p>
        </div>

        {/* Plus icon to create a folder */}
        <button
          onClick={onOpenCreateFolder}
          aria-label="Create Folder"
          className="p-2 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Folder</span>
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <FolderIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No folders yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mb-4">
            Create your first folder to organize topics for revision.
          </p>
          <button
            onClick={onOpenCreateFolder}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Folder</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {folders.map((folder) => {
            const count = topics.filter((t) => t.folder_id === folder.id).length;
            const isMenuOpen = activeMenuId === folder.id;

            return (
              <div
                key={folder.id}
                className="relative p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between group cursor-pointer shadow-sm"
                onClick={() => onSelectFolder(folder)}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <FolderIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">
                      {folder.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {count} {count === 1 ? "topic" : "topics"}
                    </p>
                  </div>
                </div>

                {/* 3-dots Menu */}
                <div
                  className="relative flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setActiveMenuId(isMenuOpen ? null : folder.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    aria-label="Folder options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onOpenRenameFolder(folder);
                        }}
                        className="w-full px-3 py-2 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onOpenDeleteFolder(folder);
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
            );
          })}
        </div>
      )}
    </section>
  );
}
