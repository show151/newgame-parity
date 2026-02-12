const PREFS_STORAGE_KEY_PREFIX = "hisei_profile_prefs_v1";
const FEATURED_CLIPS_LIMIT = 3;

type StoredPrefs = {
  matchNames?: Record<string, string>;
  featuredMatchIds?: string[];
};

function getStorageKey(userId: string) {
  return `${PREFS_STORAGE_KEY_PREFIX}:${userId}`;
}

function readPrefs(userId: string): StoredPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredPrefs;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writePrefs(userId: string, prefs: StoredPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(prefs));
}

export function getMatchNames(userId: string): Record<string, string> {
  const prefs = readPrefs(userId);
  return prefs.matchNames ?? {};
}

export function setMatchName(userId: string, matchId: string, name: string) {
  const prefs = readPrefs(userId);
  const nextMatchNames = { ...(prefs.matchNames ?? {}) };
  const trimmed = name.trim();
  if (!trimmed) {
    delete nextMatchNames[matchId];
  } else {
    nextMatchNames[matchId] = trimmed;
  }
  writePrefs(userId, { ...prefs, matchNames: nextMatchNames });
}

export function getFeaturedMatchIds(userId: string): string[] {
  const prefs = readPrefs(userId);
  const ids = prefs.featuredMatchIds ?? [];
  return Array.from(new Set(ids)).slice(0, FEATURED_CLIPS_LIMIT);
}

export function toggleFeaturedMatch(userId: string, matchId: string) {
  const prefs = readPrefs(userId);
  const current = getFeaturedMatchIds(userId);
  if (current.includes(matchId)) {
    const next = current.filter(id => id !== matchId);
    writePrefs(userId, { ...prefs, featuredMatchIds: next });
    return { ok: true as const, featuredIds: next };
  }

  if (current.length >= FEATURED_CLIPS_LIMIT) {
    return { ok: false as const, featuredIds: current };
  }

  const next = [...current, matchId];
  writePrefs(userId, { ...prefs, featuredMatchIds: next });
  return { ok: true as const, featuredIds: next };
}

export function removeMatchFromPrefs(userId: string, matchId: string) {
  const prefs = readPrefs(userId);
  const nextMatchNames = { ...(prefs.matchNames ?? {}) };
  delete nextMatchNames[matchId];
  const nextFeatured = getFeaturedMatchIds(userId).filter(id => id !== matchId);
  writePrefs(userId, {
    ...prefs,
    matchNames: nextMatchNames,
    featuredMatchIds: nextFeatured,
  });
}
