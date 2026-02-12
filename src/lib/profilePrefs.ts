import { supabase } from "@/lib/supabaseClient";

const PREFS_STORAGE_KEY_PREFIX = "hisei_profile_prefs_v2";
const FEATURED_CLIPS_LIMIT = 3;

type StoredPrefs = {
  matchNames?: Record<string, string>;
};

export type ClipPrefs = {
  starredIds: string[];
  featuredIds: string[];
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

function normalizeIds(value: unknown, limit?: number): string[] {
  const arr = Array.isArray(value) ? value.filter(x => typeof x === "string") : [];
  const unique = Array.from(new Set(arr));
  if (typeof limit === "number") return unique.slice(0, limit);
  return unique;
}

export function getClipPrefsFromUserMetadata(metadata: unknown): ClipPrefs {
  const meta = (metadata ?? {}) as { starred_match_ids?: unknown; featured_match_ids?: unknown };
  return {
    starredIds: normalizeIds(meta.starred_match_ids),
    featuredIds: normalizeIds(meta.featured_match_ids, FEATURED_CLIPS_LIMIT),
  };
}

export async function saveClipPrefsToSupabase(args: {
  starredIds: string[];
  featuredIds: string[];
}) {
  const { error } = await supabase.auth.updateUser({
    data: {
      starred_match_ids: normalizeIds(args.starredIds),
      featured_match_ids: normalizeIds(args.featuredIds, FEATURED_CLIPS_LIMIT),
    },
  });
  if (error) {
    return { ok: false as const, reason: error.message };
  }
  return { ok: true as const };
}

export function getFeaturedMatchIdsFromMetadata(metadata: unknown): string[] {
  return getClipPrefsFromUserMetadata(metadata).featuredIds;
}

export function removeMatchFromPrefs(userId: string, matchId: string) {
  const prefs = readPrefs(userId);
  const nextMatchNames = { ...(prefs.matchNames ?? {}) };
  delete nextMatchNames[matchId];
  writePrefs(userId, {
    ...prefs,
    matchNames: nextMatchNames,
  });
}
