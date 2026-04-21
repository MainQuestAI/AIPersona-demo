import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveRuntimeApiBase } from './runtimeApiBase';

describe('runtimeApiBase', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the configured base in non-browser contexts', () => {
    expect(resolveRuntimeApiBase('http://localhost:8000')).toBe('http://localhost:8000');
  });

  it('normalizes localhost api urls to the current local hostname', () => {
    vi.stubGlobal('window', {
      location: {
        origin: 'http://127.0.0.1:5173',
        hostname: '127.0.0.1',
      },
    });

    expect(resolveRuntimeApiBase('http://localhost:8000')).toBe('http://127.0.0.1:8000');
  });
});
