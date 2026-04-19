export type SessionUser = {
  id: string;
  email: string;
  role?: string;
};

export type SessionState = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

const SESSION_KEY = "fx_session";

export function saveSession(session: SessionState) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): SessionState | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getUserId(): string {
  return loadSession()?.user.id ?? "demo-user";
}
