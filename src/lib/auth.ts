export const AUTH_COOKIE_NAME = "zaidrev_session";
export const AUTH_USER_NAME = "zaid";

export interface UserAccount {
  username: string;
  role: "admin" | "guest";
  displayName: string;
}

export const VALID_USERS: Record<string, { password: string; role: "admin" | "guest"; displayName: string }> = {
  zaid: {
    password: "zai827--",
    role: "admin",
    displayName: "Mohd Zaid",
  },
  user: {
    password: "user2467::",
    role: "guest",
    displayName: "Demo User",
  },
};

export function checkCredentials(user: string, pass: string): boolean {
  const normalized = user.trim().toLowerCase();
  const account = VALID_USERS[normalized];
  return Boolean(account && account.password === pass);
}

export function setClientSession(username: string): void {
  if (typeof window === "undefined") return;
  const normalized = username.trim().toLowerCase();
  localStorage.setItem("zaidrev_user", normalized);
  // Set cookie for 30 days
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    normalized
  )}; path=/; max-age=2592000; SameSite=Lax`;
}

export function clearClientSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("zaidrev_user");
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function getClientUser(): string {
  if (typeof window === "undefined") return "zaid";
  const localVal = localStorage.getItem("zaidrev_user");
  if (localVal && VALID_USERS[localVal.trim().toLowerCase()]) {
    return localVal.trim().toLowerCase();
  }
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (match) {
    const val = decodeURIComponent(match.split("=")[1]).trim().toLowerCase();
    if (VALID_USERS[val]) {
      return val;
    }
  }
  return "zaid";
}

export function isClientAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_COOKIE_NAME}=`));
  const cookieVal = match ? decodeURIComponent(match.split("=")[1]) : null;
  const localVal = localStorage.getItem("zaidrev_user");

  return Boolean(cookieVal || localVal);
}
