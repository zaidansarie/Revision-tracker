import { Folder, Topic, UserSettings } from "@/types";
import { getTodayDateString } from "./date-utils";

/**
 * Exports all folders, topics, and settings as a formatted JSON file.
 */
export function exportToJSON(
  folders: Folder[],
  topics: Topic[],
  settings: UserSettings
): void {
  const exportData = {
    appName: "ZaidRev",
    version: "1.0",
    exportDate: new Date().toISOString(),
    settings,
    folders,
    topics,
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(exportData, null, 2)
  )}`;
  const downloadAnchor = document.createElement("a");
  const fileName = `zaidrev_backup_${getTodayDateString()}.json`;

  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Exports all folders and topics as a CSV file compatible with spreadsheet software.
 */
export function exportToCSV(folders: Folder[], topics: Topic[]): void {
  const folderMap = new Map<string, string>();
  folders.forEach((f) => folderMap.set(f.id, f.name));

  const headers = [
    "Folder Name",
    "Topic Title",
    "Revision Count",
    "Interval Stage",
    "Next Revision Date",
    "Last Revised Date",
    "Created Date",
  ];

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = topics.map((t) => [
    escapeCSV(folderMap.get(t.folder_id) || "General"),
    escapeCSV(t.title),
    escapeCSV(t.revision_count),
    escapeCSV(t.current_interval_index + 1),
    escapeCSV(t.next_revision_date),
    escapeCSV(t.last_revised_at || "Never"),
    escapeCSV(t.created_at ? t.created_at.split("T")[0] : ""),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  const fileName = `zaidrev_topics_${getTodayDateString()}.csv`;

  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}
