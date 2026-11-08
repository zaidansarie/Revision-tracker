import { supabase, isSupabaseConfigured } from "./supabase";
import { Folder, Topic, UserSettings } from "../types";
import { addDays, getTodayDateString } from "./date-utils";

const LEGACY_STORAGE_KEY_FOLDERS = "zaidrev_folders";
const LEGACY_STORAGE_KEY_TOPICS = "zaidrev_topics";
const LEGACY_STORAGE_KEY_SETTINGS = "zaidrev_settings";

const DEFAULT_SETTINGS: UserSettings = {
  user_id: "zaid",
  intervals: [1, 3, 7, 30],
  theme: "dark",
};

function getFoldersStorageKey(userId: string = "zaid"): string {
  return `zaidrev_folders_${userId.trim().toLowerCase()}`;
}

function getTopicsStorageKey(userId: string = "zaid"): string {
  return `zaidrev_topics_${userId.trim().toLowerCase()}`;
}

function getSettingsStorageKey(userId: string = "zaid"): string {
  return `zaidrev_settings_${userId.trim().toLowerCase()}`;
}

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

// ----------------- USER SETTINGS -----------------
export async function getUserSettings(userId: string = "zaid"): Promise<UserSettings> {
  const normUser = userId.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", normUser)
      .single();

    if (data && !error) {
      return {
        id: data.id,
        user_id: data.user_id,
        intervals: Array.isArray(data.intervals) ? data.intervals : DEFAULT_SETTINGS.intervals,
        theme: data.theme === "light" ? "light" : "dark",
      };
    }

    if (error && error.code === "PGRST116") {
      // Record doesn't exist, create it for this user
      const { data: created, error: createErr } = await supabase
        .from("user_settings")
        .insert({ user_id: normUser, intervals: DEFAULT_SETTINGS.intervals, theme: "dark" })
        .select()
        .single();
      if (created && !createErr) {
        return created;
      }
    }
  }

  // Local storage fallback with legacy migration for 'zaid'
  const userKey = getSettingsStorageKey(normUser);
  const stored = getLocal<UserSettings | null>(userKey, null);
  if (stored) {
    return stored;
  }

  if (normUser === "zaid") {
    const legacy = getLocal<UserSettings | null>(LEGACY_STORAGE_KEY_SETTINGS, null);
    if (legacy) {
      setLocal(userKey, legacy);
      return legacy;
    }
  }

  const defaultUserSetting: UserSettings = {
    ...DEFAULT_SETTINGS,
    user_id: normUser,
  };
  setLocal(userKey, defaultUserSetting);
  return defaultUserSetting;
}

export async function saveUserSettings(
  userId: string = "zaid",
  intervals: number[],
  theme: "dark" | "light" = "dark"
): Promise<UserSettings> {
  const normUser = userId.trim().toLowerCase();
  const sanitized = intervals.filter((n) => typeof n === "number" && n > 0);
  const finalIntervals = sanitized.length > 0 ? sanitized : [1, 3, 7, 30];

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: normUser, intervals: finalIntervals, theme },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (!error && data) {
      return data;
    }
  }

  const updated: UserSettings = {
    user_id: normUser,
    intervals: finalIntervals,
    theme,
    updated_at: new Date().toISOString(),
  };

  const userKey = getSettingsStorageKey(normUser);
  setLocal(userKey, updated);
  if (normUser === "zaid") {
    setLocal(LEGACY_STORAGE_KEY_SETTINGS, updated);
  }
  return updated;
}

// ----------------- FOLDERS -----------------
export async function getFolders(userId: string = "zaid"): Promise<Folder[]> {
  const normUser = userId.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", normUser)
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data as Folder[];
    }
  }

  const userKey = getFoldersStorageKey(normUser);
  const stored = getLocal<Folder[] | null>(userKey, null);
  if (stored !== null) {
    return stored;
  }

  if (normUser === "zaid") {
    const legacy = getLocal<Folder[]>(LEGACY_STORAGE_KEY_FOLDERS, []);
    setLocal(userKey, legacy);
    return legacy;
  }

  return [];
}

export async function createFolder(name: string, userId: string = "zaid"): Promise<Folder> {
  const normUser = userId.trim().toLowerCase();
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Folder name cannot be empty");

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("folders")
      .insert({ user_id: normUser, name: cleanName })
      .select()
      .single();

    if (!error && data) {
      return data as Folder;
    }
  }

  const newFolder: Folder = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `folder_${Date.now()}`,
    user_id: normUser,
    name: cleanName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const userKey = getFoldersStorageKey(normUser);
  const list = await getFolders(normUser);
  list.push(newFolder);
  setLocal(userKey, list);
  if (normUser === "zaid") {
    setLocal(LEGACY_STORAGE_KEY_FOLDERS, list);
  }
  return newFolder;
}

export async function renameFolder(folderId: string, newName: string, userId: string = "zaid"): Promise<void> {
  const normUser = userId.trim().toLowerCase();
  const cleanName = newName.trim();
  if (!cleanName) throw new Error("Folder name cannot be empty");

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from("folders")
      .update({ name: cleanName, updated_at: new Date().toISOString() })
      .eq("id", folderId);
    return;
  }

  const userKey = getFoldersStorageKey(normUser);
  const list = await getFolders(normUser);
  const idx = list.findIndex((f) => f.id === folderId);
  if (idx !== -1) {
    list[idx].name = cleanName;
    list[idx].updated_at = new Date().toISOString();
    setLocal(userKey, list);
    if (normUser === "zaid") {
      setLocal(LEGACY_STORAGE_KEY_FOLDERS, list);
    }
  }
}

export async function deleteFolder(folderId: string, userId: string = "zaid"): Promise<void> {
  const normUser = userId.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    await supabase.from("folders").delete().eq("id", folderId);
    return;
  }

  const folderKey = getFoldersStorageKey(normUser);
  const folders = await getFolders(normUser);
  const updatedFolders = folders.filter((f) => f.id !== folderId);
  setLocal(folderKey, updatedFolders);
  if (normUser === "zaid") {
    setLocal(LEGACY_STORAGE_KEY_FOLDERS, updatedFolders);
  }

  // Cascade delete topics in local storage for this user
  const topicKey = getTopicsStorageKey(normUser);
  const topics = await getTopics(normUser);
  const remainingTopics = topics.filter((t) => t.folder_id !== folderId);
  setLocal(topicKey, remainingTopics);
  if (normUser === "zaid") {
    setLocal(LEGACY_STORAGE_KEY_TOPICS, remainingTopics);
  }
}

// ----------------- TOPICS -----------------
export async function getTopics(userId: string = "zaid"): Promise<Topic[]> {
  const normUser = userId.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", normUser)
      .order("next_revision_date", { ascending: true });

    if (!error && data) {
      return data as Topic[];
    }
  }

  const userKey = getTopicsStorageKey(normUser);
  const stored = getLocal<Topic[] | null>(userKey, null);
  if (stored !== null) {
    return stored;
  }

  if (normUser === "zaid") {
    const legacy = getLocal<Topic[]>(LEGACY_STORAGE_KEY_TOPICS, []);
    setLocal(userKey, legacy);
    return legacy;
  }

  return [];
}

export async function createTopic(
  title: string,
  folderId: string,
  firstIntervalDays: number = 1,
  studiedDate: string = getTodayDateString(),
  userId: string = "zaid"
): Promise<Topic> {
  const normUser = userId.trim().toLowerCase();
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Topic title cannot be empty");

  const baseDate = studiedDate || getTodayDateString();
  const nextRevisionDate = addDays(baseDate, firstIntervalDays);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("topics")
      .insert({
        folder_id: folderId,
        user_id: normUser,
        title: cleanTitle,
        revision_count: 0,
        current_interval_index: 0,
        studied_date: baseDate,
        last_revised_at: null,
        next_revision_date: nextRevisionDate,
      })
      .select()
      .single();

    if (!error && data) {
      return data as Topic;
    }
  }

  const newTopic: Topic = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `topic_${Date.now()}`,
    folder_id: folderId,
    user_id: normUser,
    title: cleanTitle,
    revision_count: 0,
    current_interval_index: 0,
    studied_date: baseDate,
    last_revised_at: null,
    next_revision_date: nextRevisionDate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const userKey = getTopicsStorageKey(normUser);
  const list = await getTopics(normUser);
  list.push(newTopic);
  setLocal(userKey, list);
  if (normUser === "zaid") {
    setLocal(LEGACY_STORAGE_KEY_TOPICS, list);
  }
  return newTopic;
}

export async function updateTopic(
  topicId: string,
  updates: { title?: string; studied_date?: string },
  intervalDays?: number,
  userId: string = "zaid"
): Promise<void> {
  const normUser = userId.trim().toLowerCase();
  const cleanTitle = updates.title ? updates.title.trim() : undefined;
  if (cleanTitle === "") throw new Error("Topic title cannot be empty");

  const fieldsToUpdate: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (cleanTitle) {
    fieldsToUpdate.title = cleanTitle;
  }

  if (updates.studied_date) {
    fieldsToUpdate.studied_date = updates.studied_date;
    if (intervalDays !== undefined && intervalDays > 0) {
      fieldsToUpdate.next_revision_date = addDays(updates.studied_date, intervalDays);
    }
  }

  if (isSupabaseConfigured && supabase) {
    await supabase.from("topics").update(fieldsToUpdate).eq("id", topicId);
    return;
  }

  const userKey = getTopicsStorageKey(normUser);
  const list = await getTopics(normUser);
  const idx = list.findIndex((t) => t.id === topicId);
  if (idx !== -1) {
    if (cleanTitle) list[idx].title = cleanTitle;
    if (updates.studied_date) {
      list[idx].studied_date = updates.studied_date;
      if (intervalDays !== undefined && intervalDays > 0) {
        list[idx].next_revision_date = addDays(updates.studied_date, intervalDays);
      }
    }
    list[idx].updated_at = new Date().toISOString();
    setLocal(userKey, list);
    if (normUser === "zaid") {
      setLocal(LEGACY_STORAGE_KEY_TOPICS, list);
    }
  }
}

export async function renameTopic(topicId: string, newTitle: string, userId: string = "zaid"): Promise<void> {
  return updateTopic(topicId, { title: newTitle }, undefined, userId);
}

export async function deleteTopic(topicId: string, userId: string = "zaid"): Promise<void> {
  const normUser = userId.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    await supabase.from("topics").delete().eq("id", topicId);
    return;
  }

  const userKey = getTopicsStorageKey(normUser);
  const list = await getTopics(normUser);
  const updated = list.filter((t) => t.id !== topicId);
  setLocal(userKey, updated);
  if (normUser === "zaid") {
    setLocal(LEGACY_STORAGE_KEY_TOPICS, updated);
  }
}

export async function markTopicRevised(
  topicId: string,
  nextIntervalIndex: number,
  nextRevisionDate: string,
  revisedDate: string = getTodayDateString(),
  userId: string = "zaid"
): Promise<void> {
  const normUser = userId.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data: current } = await supabase
      .from("topics")
      .select("revision_count")
      .eq("id", topicId)
      .single();

    const count = (current?.revision_count || 0) + 1;

    await supabase
      .from("topics")
      .update({
        revision_count: count,
        current_interval_index: nextIntervalIndex,
        last_revised_at: revisedDate,
        next_revision_date: nextRevisionDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topicId);
    return;
  }

  const userKey = getTopicsStorageKey(normUser);
  const list = await getTopics(normUser);
  const idx = list.findIndex((t) => t.id === topicId);
  if (idx !== -1) {
    list[idx].revision_count = (list[idx].revision_count || 0) + 1;
    list[idx].current_interval_index = nextIntervalIndex;
    list[idx].last_revised_at = revisedDate;
    list[idx].next_revision_date = nextRevisionDate;
    list[idx].updated_at = new Date().toISOString();
    setLocal(userKey, list);
    if (normUser === "zaid") {
      setLocal(LEGACY_STORAGE_KEY_TOPICS, list);
    }
  }
}

// ----------------- DEMO USER DATA SEEDING -----------------
export async function seedDemoDataIfEmpty(userId: string): Promise<boolean> {
  const normUser = userId.trim().toLowerCase();
  if (normUser !== "user") return false;

  const SEED_FLAG_KEY = "zaidrev_seeded_demo_user";
  if (typeof window !== "undefined") {
    if (localStorage.getItem(SEED_FLAG_KEY)) {
      return false;
    }
  }

  const existingFolders = await getFolders(normUser);
  if (existingFolders.length > 0) {
    if (typeof window !== "undefined") {
      localStorage.setItem(SEED_FLAG_KEY, "true");
    }
    return false;
  }

  try {
    const demoFolder = await createFolder("System Design & Architecture", normUser);
    const today = getTodayDateString();

    // Topic 1: Due today (interval 1 was scheduled yesterday or studied today)
    // To ensure it is due today: set studiedDate as yesterday so next_revision_date is today
    const yesterday = addDays(today, -1);
    await createTopic(
      "Distributed Caching (Redis / Memcached)",
      demoFolder.id,
      1,
      yesterday,
      normUser
    );

    // Topic 2: Future revision due in 3 days
    await createTopic(
      "Database Sharding & Consistent Hashing",
      demoFolder.id,
      3,
      today,
      normUser
    );

    if (typeof window !== "undefined") {
      localStorage.setItem(SEED_FLAG_KEY, "true");
    }
    return true;
  } catch (err) {
    console.error("Failed to seed demo data for guest user:", err);
    return false;
  }
}
