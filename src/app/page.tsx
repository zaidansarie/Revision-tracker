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
  renameTopic,
  deleteTopic,
  markTopicRevised,
  saveUserSettings,
} from "@/lib/db";
import { isClientAuthenticated } from "@/lib/auth";
import { getTodayDateString, calculateNextRevision, parseLocalDate } from "@/lib/date-utils";
import Header from "@/components/Header";
import TopicsDueToday from "@/components/TopicsDueToday";
import FolderSection from "@/components/FolderSection";
import FolderDetailView from "@/components/FolderDetailView";
import SettingsModal from "@/components/SettingsModal";
import {
  CreateFolderModal,
  RenameFolderModal,
  DeleteFolderModal,
  AddTopicModal,
  RenameTopicModal,
  DeleteTopicModal,
} from "@/components/Modals";

export default function HomePage() {
  const router = useRouter();

  // Authentication check
  const [authChecked, setAuthChecked] = useState(false);

  // Core Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    user_id: "zaid",
    intervals: [1, 3, 7, 30],
    theme: "dark",
  });
  const [isLoading, setIsLoading] = useState(true);

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
  const loadData = useCallback(async () => {
    try {
      const [fList, tList, sObj] = await Promise.all([
        getFolders("zaid"),
        getTopics("zaid"),
        getUserSettings("zaid"),
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
    } catch (err) {
      console.error("Failed to load revision data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auth gate check
  useEffect(() => {
    if (!isClientAuthenticated()) {
      router.push("/login");
    } else {
      setAuthChecked(true);
      loadData();
    }
  }, [router, loadData]);

  // Handle Mark Revised
  const handleMarkRevised = async (topic: Topic) => {
    const { nextIndex, nextDate } = calculateNextRevision(
      topic.current_interval_index,
      settings.intervals,
      todayStr
    );

    await markTopicRevised(topic.id, nextIndex, nextDate, todayStr);
    await loadData();
  };

  // Folder CRUD
  const handleCreateFolder = async (name: string) => {
    await createFolder(name, "zaid");
    await loadData();
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    await renameFolder(folderId, newName);
    await loadData();
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }
    await loadData();
  };

  // Topic CRUD
  const handleAddTopic = async (title: string, folderId: string) => {
    const firstIntervalDays = settings.intervals[0] || 1;
    await createTopic(title, folderId, firstIntervalDays, "zaid");
    await loadData();
  };

  const handleRenameTopic = async (topicId: string, newTitle: string) => {
    await renameTopic(topicId, newTitle);
    await loadData();
  };

  const handleDeleteTopic = async (topicId: string) => {
    await deleteTopic(topicId);
    await loadData();
  };

  // Settings Save
  const handleSaveSettings = async (intervals: number[], theme: "dark" | "light") => {
    const updated = await saveUserSettings("zaid", intervals, theme);
    setSettings(updated);
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  // Topics due today across all folders
  const topicsDueToday = topics.filter((t) => t.next_revision_date <= todayStr);

  // Active folder object
  const activeFolder = folders.find((f) => f.id === selectedFolderId) || null;

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
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* If a folder is clicked, show Folder Detail View */}
        {activeFolder ? (
          <FolderDetailView
            folder={activeFolder}
            topics={topics}
            todayStr={todayStr}
            onBack={() => setSelectedFolderId(null)}
            onMarkRevised={handleMarkRevised}
            onOpenAddTopic={(folderId) => {
              const f = folders.find((item) => item.id === folderId);
              setFolderForNewTopic(f || activeFolder);
            }}
            onOpenRenameTopic={(topic) => setTopicToRename(topic)}
            onOpenDeleteTopic={(topic) => setTopicToDelete(topic)}
          />
        ) : (
          /* Homepage View: 
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
              onSelectFolder={(folder) => setSelectedFolderId(folder.id)}
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

      <RenameTopicModal
        topic={topicToRename}
        isOpen={Boolean(topicToRename)}
        onClose={() => setTopicToRename(null)}
        onSubmit={handleRenameTopic}
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
