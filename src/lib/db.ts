import { supabase, isSupabaseConfigured } from "./supabase";
import { Folder, Topic, UserSettings } from "../types";
import { addDays, getTodayDateString } from "./date-utils";

const LOCAL_STORAGE_KEY_FOLDERS = "zaidrev_folders";
const LOCAL_STORAGE_KEY_TOPICS = "zaidrev_topics";
const LOCAL_STORAGE_KEY_SETTINGS = "zaidrev_settings";

const DEFAULT_SETTINGS: UserSettings = {
  user_id: "zaid",
  intervals: [1, 3, 7, 30],
  theme: "dark",
};

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
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
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
      // Record doesn't exist, create it
      const { data: created, error: createErr } = await supabase
        .from("user_settings")
        .insert({ user_id: userId, intervals: DEFAULT_SETTINGS.intervals, theme: "dark" })
        .select()
        .single();
      if (created && !createErr) {
        return created;
      }
    }
  }

  return getLocal<UserSettings>(LOCAL_STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
}

export async function saveUserSettings(
  userId: string = "zaid",
  intervals: number[],
  theme: "dark" | "light" = "dark"
): Promise<UserSettings> {
  const sanitized = intervals.filter((n) => typeof n === "number" && n > 0);
  const finalIntervals = sanitized.length > 0 ? sanitized : [1, 3, 7, 30];

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: userId, intervals: finalIntervals, theme },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (!error && data) {
      return data;
    }
  }

  const updated: UserSettings = {
    user_id: userId,
    intervals: finalIntervals,
    theme,
    updated_at: new Date().toISOString(),
  };
  setLocal(LOCAL_STORAGE_KEY_SETTINGS, updated);
  return updated;
}

// ----------------- FOLDERS -----------------
export async function getFolders(userId: string = "zaid"): Promise<Folder[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data as Folder[];
    }
  }

  return getLocal<Folder[]>(LOCAL_STORAGE_KEY_FOLDERS, []);
}

export async function createFolder(name: string, userId: string = "zaid"): Promise<Folder> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Folder name cannot be empty");

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("folders")
      .insert({ user_id: userId, name: cleanName })
      .select()
      .single();

    if (!error && data) {
      return data as Folder;
    }
  }

  const newFolder: Folder = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `folder_${Date.now()}`,
    user_id: userId,
    name: cleanName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = getLocal<Folder[]>(LOCAL_STORAGE_KEY_FOLDERS, []);
  list.push(newFolder);
  setLocal(LOCAL_STORAGE_KEY_FOLDERS, list);
  return newFolder;
}

export async function renameFolder(folderId: string, newName: string): Promise<void> {
  const cleanName = newName.trim();
  if (!cleanName) throw new Error("Folder name cannot be empty");

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from("folders")
      .update({ name: cleanName, updated_at: new Date().toISOString() })
      .eq("id", folderId);
    return;
  }

  const list = getLocal<Folder[]>(LOCAL_STORAGE_KEY_FOLDERS, []);
  const idx = list.findIndex((f) => f.id === folderId);
  if (idx !== -1) {
    list[idx].name = cleanName;
    list[idx].updated_at = new Date().toISOString();
    setLocal(LOCAL_STORAGE_KEY_FOLDERS, list);
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("folders").delete().eq("id", folderId);
    return;
  }

  const list = getLocal<Folder[]>(LOCAL_STORAGE_KEY_FOLDERS, []);
  const updated = list.filter((f) => f.id !== folderId);
  setLocal(LOCAL_STORAGE_KEY_FOLDERS, updated);

  // Cascade delete topics in local storage
  const topics = getLocal<Topic[]>(LOCAL_STORAGE_KEY_TOPICS, []);
  const remainingTopics = topics.filter((t) => t.folder_id !== folderId);
  setLocal(LOCAL_STORAGE_KEY_TOPICS, remainingTopics);
}

// ----------------- TOPICS -----------------
export async function getTopics(userId: string = "zaid"): Promise<Topic[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", userId)
      .order("next_revision_date", { ascending: true });

    if (!error && data) {
      return data as Topic[];
    }
  }

  return getLocal<Topic[]>(LOCAL_STORAGE_KEY_TOPICS, []);
}

export async function createTopic(
  title: string,
  folderId: string,
  firstIntervalDays: number = 1,
  userId: string = "zaid"
): Promise<Topic> {
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Topic title cannot be empty");

  const today = getTodayDateString();
  const nextRevisionDate = addDays(today, firstIntervalDays);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("topics")
      .insert({
        folder_id: folderId,
        user_id: userId,
        title: cleanTitle,
        revision_count: 0,
        current_interval_index: 0,
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
    user_id: userId,
    title: cleanTitle,
    revision_count: 0,
    current_interval_index: 0,
    last_revised_at: null,
    next_revision_date: nextRevisionDate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = getLocal<Topic[]>(LOCAL_STORAGE_KEY_TOPICS, []);
  list.push(newTopic);
  setLocal(LOCAL_STORAGE_KEY_TOPICS, list);
  return newTopic;
}

export async function renameTopic(topicId: string, newTitle: string): Promise<void> {
  const cleanTitle = newTitle.trim();
  if (!cleanTitle) throw new Error("Topic title cannot be empty");

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from("topics")
      .update({ title: cleanTitle, updated_at: new Date().toISOString() })
      .eq("id", topicId);
    return;
  }

  const list = getLocal<Topic[]>(LOCAL_STORAGE_KEY_TOPICS, []);
  const idx = list.findIndex((t) => t.id === topicId);
  if (idx !== -1) {
    list[idx].title = cleanTitle;
    list[idx].updated_at = new Date().toISOString();
    setLocal(LOCAL_STORAGE_KEY_TOPICS, list);
  }
}

export async function deleteTopic(topicId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("topics").delete().eq("id", topicId);
    return;
  }

  const list = getLocal<Topic[]>(LOCAL_STORAGE_KEY_TOPICS, []);
  const updated = list.filter((t) => t.id !== topicId);
  setLocal(LOCAL_STORAGE_KEY_TOPICS, updated);
}

export async function markTopicRevised(
  topicId: string,
  nextIntervalIndex: number,
  nextRevisionDate: string,
  revisedDate: string = getTodayDateString()
): Promise<void> {
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

  const list = getLocal<Topic[]>(LOCAL_STORAGE_KEY_TOPICS, []);
  const idx = list.findIndex((t) => t.id === topicId);
  if (idx !== -1) {
    list[idx].revision_count = (list[idx].revision_count || 0) + 1;
    list[idx].current_interval_index = nextIntervalIndex;
    list[idx].last_revised_at = revisedDate;
    list[idx].next_revision_date = nextRevisionDate;
    list[idx].updated_at = new Date().toISOString();
    setLocal(LOCAL_STORAGE_KEY_TOPICS, list);
  }
}
