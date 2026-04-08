import { describe, expect, it } from 'vitest';

import {
  getActiveStudyId,
  getLatestStudySession,
  rememberLatestStudySession,
} from './studySession';

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('studySession', () => {
  it('extracts study id from workbench route params', () => {
    expect(getActiveStudyId('/workbench/study-1', '')).toBe('study-1');
  });

  it('extracts study id from compare and twins query strings', () => {
    expect(getActiveStudyId('/compare', '?studyId=study-2')).toBe('study-2');
    expect(getActiveStudyId('/twins', '?studyId=study-3')).toBe('study-3');
  });

  it('returns empty string when there is no active study context', () => {
    expect(getActiveStudyId('/workbench', '')).toBe('');
  });

  it('persists and restores the latest study session', () => {
    const storage = createStorageMock();
    const saved = rememberLatestStudySession(
      {
        id: 'study-9',
        businessQuestion: '哪个概念值得进入下一轮？',
      },
      storage,
    );

    const restored = getLatestStudySession(storage);
    expect(restored).toEqual(saved);
  });

  it('returns null for invalid stored payload', () => {
    const storage = createStorageMock();
    storage.setItem('aipersona-demo/latest-study-session', '{"foo":"bar"}');
    expect(getLatestStudySession(storage)).toBeNull();
  });
});
