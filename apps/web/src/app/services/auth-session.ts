import { resolveRuntimeApiBase } from './runtimeApiBase';

export type AuthUser = {
  id?: string;
  email?: string;
  display_name?: string;
  role?: string;
  auth_user_id?: string;
  auth_provider?: string;
};

export type AuthTeam = {
  id: string;
  name: string;
  slug?: string;
  member_role?: string;
};

export type AuthSessionPayload = {
  user: AuthUser;
  team?: AuthTeam | null;
  teams?: AuthTeam[];
  active_team_id?: string;
  auth_mode?: string;
};

const USER_KEY = 'aipersona_user';
const TEAMS_KEY = 'aipersona_teams';
const ACTIVE_TEAM_KEY = 'aipersona_active_team_id';
const AUTH_MODE_KEY = 'aipersona_auth_mode';

function hasStorage(): boolean {
  return typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

function notifyAuthChanged(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('aipersona-auth-changed'));
  }
}

function sanitizeTeams(rawTeams: unknown[] | undefined, team?: AuthTeam | null): AuthTeam[] {
  const teams = Array.isArray(rawTeams)
    ? rawTeams.filter((item): item is AuthTeam => Boolean(item) && typeof item === 'object' && typeof (item as AuthTeam).id === 'string')
    : [];
  if (team && !teams.some((item) => item.id === team.id)) {
    teams.unshift(team);
  }
  return teams;
}

export function readStoredUser(): AuthUser | null {
  if (!hasStorage()) {
    return null;
  }
  const raw = globalThis.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function readStoredTeams(): AuthTeam[] {
  if (!hasStorage()) {
    return [];
  }
  const raw = globalThis.localStorage.getItem(TEAMS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is AuthTeam => Boolean(item) && typeof item === 'object' && typeof (item as AuthTeam).id === 'string');
  } catch {
    return [];
  }
}

export function readStoredAuthMode(): string {
  if (!hasStorage()) {
    return '';
  }
  return globalThis.localStorage.getItem(AUTH_MODE_KEY) ?? '';
}

export function readActiveTeamId(): string {
  if (!hasStorage()) {
    return '';
  }
  return globalThis.localStorage.getItem(ACTIVE_TEAM_KEY) ?? '';
}

export function setActiveTeamId(teamId: string): void {
  if (!hasStorage()) {
    return;
  }
  if (teamId.trim()) {
    globalThis.localStorage.setItem(ACTIVE_TEAM_KEY, teamId.trim());
  } else {
    globalThis.localStorage.removeItem(ACTIVE_TEAM_KEY);
  }
  notifyAuthChanged();
}

export function getActiveTeamId(): string {
  const teams = readStoredTeams();
  const stored = readActiveTeamId();
  if (stored && teams.some((team) => team.id === stored)) {
    return stored;
  }
  const fallback = teams[0]?.id ?? '';
  if (fallback) {
    globalThis.localStorage.setItem(ACTIVE_TEAM_KEY, fallback);
  } else if (stored && hasStorage()) {
    globalThis.localStorage.removeItem(ACTIVE_TEAM_KEY);
  }
  return fallback;
}

export function persistAuthSession(data: AuthSessionPayload): void {
  if (!hasStorage()) {
    return;
  }
  globalThis.localStorage.setItem(USER_KEY, JSON.stringify(data.user ?? {}));

  const teams = sanitizeTeams(data.teams, data.team);
  if (teams.length > 0) {
    globalThis.localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  } else {
    globalThis.localStorage.removeItem(TEAMS_KEY);
  }

  if (data.auth_mode?.trim()) {
    globalThis.localStorage.setItem(AUTH_MODE_KEY, data.auth_mode.trim());
  } else {
    globalThis.localStorage.removeItem(AUTH_MODE_KEY);
  }

  if (data.active_team_id?.trim()) {
    globalThis.localStorage.setItem(ACTIVE_TEAM_KEY, data.active_team_id.trim());
  } else {
    getActiveTeamId();
  }

  notifyAuthChanged();
}

export function clearAuthSession(): void {
  if (!hasStorage()) {
    return;
  }
  globalThis.localStorage.removeItem(USER_KEY);
  globalThis.localStorage.removeItem(TEAMS_KEY);
  globalThis.localStorage.removeItem(ACTIVE_TEAM_KEY);
  globalThis.localStorage.removeItem(AUTH_MODE_KEY);
  notifyAuthChanged();
}

export async function fetchAuthSession(): Promise<AuthSessionPayload | null> {
  const response = await fetch(`${resolveRuntimeApiBase()}/auth/me`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `读取登录状态失败：${response.status}`);
  }

  return (await response.json()) as AuthSessionPayload;
}

export async function logoutAuthSession(): Promise<void> {
  try {
    await fetch(`${resolveRuntimeApiBase()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    clearAuthSession();
  }
}

export function buildOAuthLoginUrl(redirectPath: string): string {
  const portalUrl = (import.meta.env.VITE_OAUTH_PORTAL_URL || '').trim();
  const clientId = (import.meta.env.VITE_OAUTH_CLIENT_ID || '').trim();
  if (!portalUrl || !clientId) {
    throw new Error('MainQuest Auth 尚未配置，请设置 VITE_OAUTH_PORTAL_URL 和 VITE_OAUTH_CLIENT_ID');
  }

  const normalizedRedirect = redirectPath.startsWith('/') ? redirectPath : '/dashboard';
  const state = btoa(JSON.stringify({
    redirect_path: normalizedRedirect,
    web_origin: window.location.origin,
  }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  const redirectUri = `${resolveRuntimeApiBase()}/api/oauth/callback`;
  const url = new URL(`${portalUrl}/oauth/authorize`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  return url.toString();
}

export function canUseDevAuth(): boolean {
  const enabled = String(import.meta.env.VITE_ENABLE_DEV_AUTH || '').toLowerCase();
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  return ['1', 'true', 'yes', 'on'].includes(enabled) && ['localhost', '127.0.0.1'].includes(host);
}
