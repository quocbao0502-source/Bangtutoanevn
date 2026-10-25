// A damaged or unavailable browser store must never prevent the app from opening.
export function readStored<T>(key: string, fallback: T, valid: (value: unknown) => boolean): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    if (valid(value)) return value as T;
    throw new Error('Invalid stored data');
  } catch {
    if (raw !== null) {
      try { localStorage.setItem(`${key}_recovery`, raw); } catch { /* Storage may be full. */ }
    }
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function validCoordinates(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}
