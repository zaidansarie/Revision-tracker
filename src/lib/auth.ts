export const AUTH_COOKIE_NAME = "zaidrev_session";
export const AUTH_USER_NAME = "zaid";

const VALID_USERNAME = "zaid";
const VALID_PASSWORD = "zai827--";

export function checkCredentials(user: string, pass: string): boolean {
  return user.trim() === VALID_USERNAME && pass === VALID_PASSWORD;
}

export function setClientSession(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("zaidrev_user", username);
  // Set cookie for 30 days
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    username
  )}; path=/; max-age=2592000; SameSite=Lax`;
}

export function clearClientSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("zaidrev_user");
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
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
