export type AuthUser = {
  id?: string;
  email?: string;
  display_name?: string;
  role?: string;
};

export type AuthTeam = {
  id: string;
  name: string;
  slug?: string;
  member_role?: string;
};

const TOKEN_KEY = 'aipersona_token';
const USER_KEY = 'aipersona_user';
const TEAMS_KEY = 'aipersona_teams';
const ACTIVE_TEAM_KEY = 'aipersona_active_team_id';

function hasStorage(): boolean {
  return typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

export function getAuthToken(): string {
  if (!hasStorage()) {
    return '';
  }
  return globalThis.localStorage.getItem(TOKEN_KEY) ?? '';
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
}

export function getActiveTeamId(): string {
  const teams = readStoredTeams();
  const stored = readActiveTeamId();
  if (stored && teams.some((team) => team.id === stored)) {
    return stored;
  }
  const fallback = teams[0]?.id ?? '';
  if (fallback) {
    setActiveTeamId(fallback);
  } else if (stored) {
    setActiveTeamId('');
  }
  return fallback;
}

export function persistAuthSession(data: {
  token?: string;
  user?: Record<string, unknown>;
  teams?: unknown[];
}): void {
  if (!hasStorage()) {
    return;
  }
  globalThis.localStorage.setItem(TOKEN_KEY, data.token ?? '');
  globalThis.localStorage.setItem(USER_KEY, JSON.stringify(data.user ?? {}));

  if (data.teams?.length) {
    globalThis.localStorage.setItem(TEAMS_KEY, JSON.stringify(data.teams));
  } else {
    globalThis.localStorage.removeItem(TEAMS_KEY);
  }

  getActiveTeamId();
}

export function clearAuthSession(): void {
  if (!hasStorage()) {
    return;
  }
  globalThis.localStorage.removeItem(TOKEN_KEY);
  globalThis.localStorage.removeItem(USER_KEY);
  globalThis.localStorage.removeItem(TEAMS_KEY);
  globalThis.localStorage.removeItem(ACTIVE_TEAM_KEY);
}
