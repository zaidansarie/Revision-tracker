"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalTopicsCount: number;
  folderName?: string;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  totalTopicsCount,
  folderName,
}: SearchBarProps) {
  const placeholderText = folderName
    ? `Search topics in "${folderName}" (${totalTopicsCount} topics)...`
    : `Search all ${totalTopicsCount} topics across folders...`;

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <span className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholderText}
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
