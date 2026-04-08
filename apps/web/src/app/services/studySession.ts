export type LatestStudySession = {
  id: string;
  businessQuestion?: string | null;
  updatedAt: string;
};

const LATEST_STUDY_SESSION_KEY = 'aipersona-demo/latest-study-session';
const LATEST_STUDY_SESSION_EVENT = 'aipersona-demo:latest-study-session-updated';

function getStorage(storage?: Storage): Storage | null {
  if (storage) {
    return storage;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function isLatestStudySession(value: unknown): value is LatestStudySession {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.updatedAt === 'string';
}

export function getActiveStudyId(pathname: string, search: string): string {
  if (pathname.startsWith('/studies/')) {
    return decodeURIComponent(pathname.split('/')[2] ?? '');
  }
  if (pathname.startsWith('/workbench/')) {
    return decodeURIComponent(pathname.split('/')[2] ?? '');
  }
  return new URLSearchParams(search).get('studyId') ?? '';
}

export function rememberLatestStudySession(
  session: { id: string; businessQuestion?: string | null },
  storage?: Storage,
): LatestStudySession {
  const payload: LatestStudySession = {
    id: session.id,
    businessQuestion: session.businessQuestion ?? null,
    updatedAt: new Date().toISOString(),
  };
  const targetStorage = getStorage(storage);
  targetStorage?.setItem(LATEST_STUDY_SESSION_KEY, JSON.stringify(payload));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LATEST_STUDY_SESSION_EVENT, { detail: payload }));
  }
  return payload;
}

export function getLatestStudySession(storage?: Storage): LatestStudySession | null {
  const targetStorage = getStorage(storage);
  const rawValue = targetStorage?.getItem(LATEST_STUDY_SESSION_KEY);
  if (!rawValue) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return isLatestStudySession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function subscribeLatestStudySession(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === LATEST_STUDY_SESSION_KEY) {
      listener();
    }
  };
  const handleSessionUpdate = () => {
    listener();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(LATEST_STUDY_SESSION_EVENT, handleSessionUpdate);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(LATEST_STUDY_SESSION_EVENT, handleSessionUpdate);
  };
}
