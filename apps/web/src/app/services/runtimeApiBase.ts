const DEFAULT_RUNTIME_API_BASE = 'http://127.0.0.1:8000';

export function resolveRuntimeApiBase(
  rawBase = (import.meta.env.VITE_STUDY_RUNTIME_API_URL || DEFAULT_RUNTIME_API_BASE) as string,
): string {
  try {
    if (typeof window === 'undefined') {
      return rawBase.replace(/\/$/, '');
    }
    const apiUrl = new URL(rawBase, window.location.origin);
    const pageHost = window.location.hostname;
    const localHosts = new Set(['localhost', '127.0.0.1']);
    if (
      localHosts.has(apiUrl.hostname)
      && localHosts.has(pageHost)
      && apiUrl.hostname !== pageHost
    ) {
      apiUrl.hostname = pageHost;
    }
    return apiUrl.toString().replace(/\/$/, '');
  } catch {
    return rawBase.replace(/\/$/, '');
  }
}
