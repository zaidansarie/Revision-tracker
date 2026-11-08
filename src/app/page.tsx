"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Folder, Topic, UserSettings } from "@/types";
import {
  getFolders,
  getTopics,
  getUserSettings,
  createFolder,
  renameFolder,
  deleteFolder,
  createTopic,
  updateTopic,
  renameTopic,
  deleteTopic,
  markTopicRevised,
  saveUserSettings,
  seedDemoDataIfEmpty,
} from "@/lib/db";
import { isClientAuthenticated, getClientUser } from "@/lib/auth";
import { getTodayDateString, calculateNextRevision, parseLocalDate, formatDisplayDate } from "@/lib/date-utils";
import { registerServiceWorker, checkAndTriggerMorningReminder } from "@/lib/notifications";
import Header from "@/components/Header";
import TopicsDueToday from "@/components/TopicsDueToday";
import FolderSection from "@/components/FolderSection";
import FolderDetailView from "@/components/FolderDetailView";
import SettingsModal from "@/components/SettingsModal";
import SearchBar from "@/components/SearchBar";
import {
  CreateFolderModal,
  RenameFolderModal,
  DeleteFolderModal,
  AddTopicModal,
  EditTopicModal,
  DeleteTopicModal,
} from "@/components/Modals";
import { Folder as FolderIcon, Calendar, CheckCircle2, Clock } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // Authentication check
  const [authChecked, setAuthChecked] = useState(false);

  // Current User
  const [currentUser, setCurrentUser] = useState<string>("zaid");

  // Core Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    user_id: "zaid",
    intervals: [1, 3, 7, 30],
    theme: "dark",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // Active Selected Folder for drill-down view
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Folder Modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  // Topic Modals
  const [folderForNewTopic, setFolderForNewTopic] = useState<Folder | null>(null);
  const [topicToRename, setTopicToRename] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  // Today's date string
  const todayStr = getTodayDateString();

  // Load all user data
  const loadData = useCallback(async (forcedUser?: string) => {
    try {
      const activeUser = forcedUser || getClientUser();
      setCurrentUser(activeUser);

      // Seed starter data for guest/demo reviewer on initial visit
      if (activeUser === "user") {
        await seedDemoDataIfEmpty(activeUser);
      }

      const [fList, tList, sObj] = await Promise.all([
        getFolders(activeUser),
        getTopics(activeUser),
        getUserSettings(activeUser),
      ]);
      setFolders(fList);
      setTopics(tList);
      setSettings(sObj);

      // Apply theme to html root
      if (sObj.theme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }

      // Check morning notifications for topics due today
      const due = tList.filter((t) => t.next_revision_date <= todayStr);
      checkAndTriggerMorningReminder(due);
    } catch (err) {
      console.error("Failed to load revision data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [todayStr]);

  // Auth gate check & PWA Service worker registration
  useEffect(() => {
    if (!isClientAuthenticated()) {
      router.push("/login");
    } else {
      setAuthChecked(true);
      const user = getClientUser();
      setCurrentUser(user);
      loadData(user);
      registerServiceWorker();
    }
  }, [router, loadData]);

  // Handle Mark Revised (Strictly only allowed if due today or overdue)
  const handleMarkRevised = async (topic: Topic) => {
    if (topic.next_revision_date > todayStr) {
      console.warn("Early revision is not allowed. Topic is not due yet.");
      return;
    }

    const { nextIndex, nextDate } = calculateNextRevision(
      topic.current_interval_index,
      settings.intervals,
      todayStr
    );

    await markTopicRevised(topic.id, nextIndex, nextDate, todayStr, currentUser);
    await loadData(currentUser);
  };

  // Folder CRUD
  const handleCreateFolder = async (name: string) => {
    await createFolder(name, currentUser);
    await loadData(currentUser);
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    await renameFolder(folderId, newName, currentUser);
    await loadData(currentUser);
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId, currentUser);
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }
    await loadData(currentUser);
  };

  // Topic CRUD
  const handleAddTopic = async (title: string, folderId: string, studiedDate: string) => {
    const firstIntervalDays = settings.intervals[0] || 1;
    await createTopic(title, folderId, firstIntervalDays, studiedDate, currentUser);
    await loadData(currentUser);
  };

  const handleEditTopic = async (topicId: string, newTitle: string, newStudiedDate: string) => {
    const topic = topics.find((t) => t.id === topicId);
    const intervalIndex = topic?.current_interval_index || 0;
    const intervalDays = settings.intervals[intervalIndex] || 1;
    await updateTopic(topicId, { title: newTitle, studied_date: newStudiedDate }, intervalDays, currentUser);
    await loadData(currentUser);
  };

  const handleDeleteTopic = async (topicId: string) => {
    await deleteTopic(topicId, currentUser);
    await loadData(currentUser);
  };

  // Settings Save
  const handleSaveSettings = async (intervals: number[], theme: "dark" | "light") => {
    const updated = await saveUserSettings(currentUser, intervals, theme);
    setSettings(updated);
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  // Map folder id to name
  const folderMap = new Map<string, string>();
  folders.forEach((f) => folderMap.set(f.id, f.name));

  // Topics due today across all folders
  const topicsDueToday = topics.filter((t) => t.next_revision_date <= todayStr);

  // Active folder object
  const activeFolder = folders.find((f) => f.id === selectedFolderId) || null;

  // Filter topics based on current view scope (folder vs all)
  const scopedTopics = activeFolder
    ? topics.filter((t) => t.folder_id === activeFolder.id)
    : topics;

  // Filter topics based on search query
  const queryClean = searchQuery.trim().toLowerCase();
  const searchResults = queryClean
    ? scopedTopics.filter((t) => {
        const folderName = folderMap.get(t.folder_id) || "";
        return (
          t.title.toLowerCase().includes(queryClean) ||
          (!activeFolder && folderName.toLowerCase().includes(queryClean))
        );
      })
    : [];

  // Format today's date nicely for header
  const todayDateObj = parseLocalDate(todayStr);
  const formattedToday = todayDateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading ZaidRev...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-150">
      {/* Top Header with Brand, Current Date & Menu */}
      <Header
        currentDateFormatted={formattedToday}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={currentUser}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Search Bar scoped to current folder or all */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalTopicsCount={scopedTopics.length}
          folderName={activeFolder?.name}
        />

        {/* If Search is active, show scoped search results */}
        {queryClean ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Search Results</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    {searchResults.length}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {activeFolder
                    ? `Matching "${searchQuery}" inside folder "${activeFolder.name}"`
                    : `Matching "${searchQuery}" across all folders`}
                </p>
              </div>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No topics found matching "{searchQuery}"
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Try searching for a different keyword or topic title.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map((topic) => {
                  const isDue = topic.next_revision_date <= todayStr;
                  const isOverdue = topic.next_revision_date < todayStr;
                  const dateLabel = formatDisplayDate(topic.next_revision_date, todayStr);
                  const folderName = folderMap.get(topic.folder_id) || "General";

                  return (
                    <div
                      key={topic.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setSelectedFolderId(topic.folder_id);
                              setSearchQuery("");
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700/60 max-w-[180px] truncate hover:border-indigo-400 transition"
                            title={`Open folder ${folderName}`}
                          >
                            <FolderIcon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{folderName}</span>
                          </button>

                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isOverdue
                                ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20"
                                : isDue
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{dateLabel}</span>
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 break-words">
                          {topic.title}
                        </h3>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>Revision #{topic.revision_count + 1}</span>
                        </div>
                      </div>

                      {isDue && (
                        <button
                          onClick={() => handleMarkRevised(topic)}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Revised</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : activeFolder ? (
          /* If a folder is clicked, show Folder Detail View */
          <FolderDetailView
            folder={activeFolder}
            topics={topics}
            todayStr={todayStr}
            onBack={() => {
              setSelectedFolderId(null);
              setSearchQuery("");
            }}
            onMarkRevised={handleMarkRevised}
            onOpenAddTopic={(folderId) => {
              const f = folders.find((item) => item.id === folderId);
              setFolderForNewTopic(f || activeFolder);
            }}
            onOpenRenameTopic={(topic) => setTopicToRename(topic)}
            onOpenDeleteTopic={(topic) => setTopicToDelete(topic)}
          />
        ) : (
          /* Default Homepage View:
             1. Topics to be revised today (filtered by All or folder-wise)
             2. Folder section below it
          */
          <>
            {/* 1. Topics to revise today */}
            <TopicsDueToday
              topics={topicsDueToday}
              folders={folders}
              todayStr={todayStr}
              onMarkRevised={handleMarkRevised}
            />

            {/* 2. Below topics to be revised, comes folder section */}
            <FolderSection
              folders={folders}
              topics={topics}
              onSelectFolder={(folder) => {
                setSelectedFolderId(folder.id);
                setSearchQuery("");
              }}
              onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
              onOpenRenameFolder={(folder) => setFolderToRename(folder)}
              onOpenDeleteFolder={(folder) => setFolderToDelete(folder)}
            />
          </>
        )}
      </main>

      {/* Settings Modal under Menu */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        folders={folders}
        topics={topics}
        onSave={handleSaveSettings}
      />

      {/* Folder Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <RenameFolderModal
        folder={folderToRename}
        isOpen={Boolean(folderToRename)}
        onClose={() => setFolderToRename(null)}
        onSubmit={handleRenameFolder}
      />

      <DeleteFolderModal
        folder={folderToDelete}
        isOpen={Boolean(folderToDelete)}
        onClose={() => setFolderToDelete(null)}
        onSubmit={handleDeleteFolder}
      />

      {/* Topic Modals */}
      <AddTopicModal
        folder={folderForNewTopic}
        firstIntervalDays={settings.intervals[0] || 1}
        isOpen={Boolean(folderForNewTopic)}
        onClose={() => setFolderForNewTopic(null)}
        onSubmit={handleAddTopic}
      />

      <EditTopicModal
        topic={topicToRename}
        currentIntervalDays={
          topicToRename
            ? settings.intervals[topicToRename.current_interval_index] || 1
            : settings.intervals[0] || 1
        }
        isOpen={Boolean(topicToRename)}
        onClose={() => setTopicToRename(null)}
        onSubmit={handleEditTopic}
      />

      <DeleteTopicModal
        topic={topicToDelete}
        isOpen={Boolean(topicToDelete)}
        onClose={() => setTopicToDelete(null)}
        onSubmit={handleDeleteTopic}
      />
    </div>
  );
}
