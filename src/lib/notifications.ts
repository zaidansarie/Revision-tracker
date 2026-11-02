import { Topic } from "@/types";
import { getTodayDateString } from "./date-utils";

const LOCAL_STORAGE_KEY_LAST_NOTIFIED = "zaidrev_last_notified_date";
const LOCAL_STORAGE_KEY_NOTIF_ENABLED = "zaidrev_notif_enabled";
const LOCAL_STORAGE_KEY_REMINDER_TIME = "zaidrev_reminder_time";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export function areNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_ENABLED);
  return stored === "true" && getNotificationPermission() === "granted";
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY_NOTIF_ENABLED, String(enabled));
}

export function getReminderTime(): string {
  if (typeof window === "undefined") return "08:00";
  return localStorage.getItem(LOCAL_STORAGE_KEY_REMINDER_TIME) || "08:00";
}

export function setReminderTime(timeStr: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY_REMINDER_TIME, timeStr);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === "granted";
    setNotificationsEnabled(granted);
    return granted;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }
}

export async function sendNotification(title: string, body: string): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const options: NotificationOptions = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch (err) {
    console.error("Error displaying notification:", err);
  }
}

/**
 * Checks if morning reminder should trigger for topics due today.
 * Triggers at most once per day.
 */
export async function checkAndTriggerMorningReminder(
  topicsDueToday: Topic[],
  force: boolean = false
): Promise<boolean> {
  if (!areNotificationsEnabled()) return false;

  const todayStr = getTodayDateString();
  const lastNotified = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_NOTIFIED);

  if (!force && lastNotified === todayStr) {
    return false;
  }

  const count = topicsDueToday.length;
  if (count === 0 && !force) {
    return false;
  }

  const title = "ZaidRev Morning Reminder";
  const body =
    count === 1
      ? "You have 1 topic scheduled to revise today!"
      : `You have ${count} topics scheduled to revise today!`;

  await sendNotification(title, body);
  localStorage.setItem(LOCAL_STORAGE_KEY_LAST_NOTIFIED, todayStr);
  return true;
}

/**
 * Fires an instant test notification so the user can verify permissions on their device.
 */
export async function sendTestNotification(): Promise<void> {
  await sendNotification(
    "ZaidRev Notification Test",
    "Morning revision notifications are working on this device!"
  );
}

