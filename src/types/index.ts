export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  revision_count: number;
  current_interval_index: number;
  last_revised_at: string | null;
  next_revision_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id?: string;
  user_id: string;
  intervals: number[]; // e.g. [1, 3, 7, 30]
  theme?: "dark" | "light";
  updated_at?: string;
}
