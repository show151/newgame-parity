"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getClipPrefsFromUserMetadata, getMatchNames, saveClipPrefsToSupabase } from "@/lib/profilePrefs";

type MatchRow = {
  id: string;
  created_at: string;
  winner: string;
  moves_count: number;
  final_board: number[];
};

type UserMeta = {
  display_name?: string;
  status_message?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [status, setStatus] = useState("読み込み中...");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [matchNames, setMatchNames] = useState<Record<string, string>>({});
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [starredIdsForSave, setStarredIdsForSave] = useState<string[]>([]);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [clipsEditOpen, setClipsEditOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) {
        router.replace("/login");
        return;
      }

      setUserId(auth.user.id);
      setEmail(auth.user.email ?? "");

      const meta = (auth.user.user_metadata ?? {}) as UserMeta;
      setDisplayName(meta.display_name ?? "");
      setStatusMessage(meta.status_message ?? "");

      const names = getMatchNames(auth.user.id);
      const clipPrefs = getClipPrefsFromUserMetadata(auth.user.user_metadata);
      setMatchNames(names);
      setFeaturedIds(clipPrefs.featuredIds);
      setStarredIdsForSave(clipPrefs.starredIds);

      const { data, error } = await supabase
        .from("matches")
        .select("id, created_at, winner, moves_count, final_board")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        setStatus(`プロフィール読み込みに失敗しました。詳細: ${error.message}`);
        return;
      }

      setRows((data ?? []) as MatchRow[]);
      setStatus("");
    })();
  }, [router]);

  const featuredRows = useMemo(() => {
    const byId = new Map(rows.map(row => [row.id, row]));
    return featuredIds.map(id => byId.get(id)).filter((x): x is MatchRow => Boolean(x));
  }, [rows, featuredIds]);

  const saveProfile = async () => {
    setSaving(true);
    setStatus("");
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          status_message: statusMessage.trim(),
        },
      });
      if (error) {
        setStatus(`プロフィール保存に失敗しました。詳細: ${error.message}`);
        return;
      }
      setStatus("プロフィールを保存しました。");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    setStatus("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setStatus(`ログアウトに失敗しました。詳細: ${error.message}`);
        return;
      }
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const frameRows = useMemo(() => {
    const slots: Array<MatchRow | null> = [null, null, null];
    for (let i = 0; i < 3; i += 1) {
      slots[i] = featuredRows[i] ?? null;
    }
    return slots;
  }, [featuredRows]);

  const onToggleFeaturedWithStar = (matchId: string) => {
    if (!userId) return;
    const current = [...featuredIds];
    let next: string[];
    if (current.includes(matchId)) {
      next = current.filter(id => id !== matchId);
    } else {
      if (current.length >= 3) {
        setStatus("厳選クリップは3件まで選択できます。");
        return;
      }
      next = [...current, matchId];
    }
    setFeaturedIds(next);
    saveClipPrefsToSupabase({ starredIds: starredIdsForSave, featuredIds: next }).then(res => {
      if (!res.ok) setStatus(`厳選クリップの保存に失敗しました。詳細: ${res.reason}`);
    });
  };

  return (
    <main style={{ padding: 24, display: "grid", gap: 12, justifyItems: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>プロフィール</h1>

      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>基本情報</h2>
          <button style={btnStyle} onClick={() => setProfileEditOpen(v => !v)}>
            {profileEditOpen ? "編集を閉じる" : "編集"}
          </button>
        </div>
        <div><b>名前:</b> {displayName || "（未設定）"}</div>
        <div><b>ステータス:</b> {statusMessage || "（未設定）"}</div>
        <div style={{ fontSize: 13, color: "#666" }}>ログイン中: {email || "(不明)"}</div>
        {profileEditOpen && (
          <div style={{ display: "grid", gap: 8, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>名前</span>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} placeholder="表示名を入力" />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>ステータスメッセージ</span>
              <textarea
                value={statusMessage}
                onChange={e => setStatusMessage(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                placeholder="ひとこと"
              />
            </label>
            <button onClick={saveProfile} disabled={saving} style={btnStyle}>
              {saving ? "保存中..." : "プロフィールを保存"}
            </button>
          </div>
        )}
      </section>

      <div style={{ width: "100%", maxWidth: 760, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={logout} disabled={loggingOut} style={btnStyle}>
          {loggingOut ? "ログアウト中..." : "ログアウト"}
        </button>
        <Link href="/" style={btnStyle}>ホームへ戻る</Link>
        <Link href="/history" style={btnStyle}>保存棋譜へ</Link>
      </div>

      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>厳選クリップ</h2>
          <button style={btnStyle} onClick={() => setClipsEditOpen(v => !v)}>
            {clipsEditOpen ? "編集を閉じる" : "編集"}
          </button>
        </div>
        <div style={{ fontSize: 14, color: "#666" }}>{featuredRows.length}/3 件</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {frameRows.map((row, idx) => (
            <div key={idx} style={frameStyle}>
              <div style={{ fontSize: 12, color: "#6c5331", fontWeight: 700 }}>CLIP {idx + 1}</div>
              {row ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{matchNames[row.id] || "（名前なし）"}</div>
                  <MiniBoard board={row.final_board} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    <Link href={`/history/${row.id}`} style={btnStyle}>再生</Link>
                    {clipsEditOpen && <button onClick={() => onToggleFeaturedWithStar(row.id)} style={btnStyle}>外す</button>}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "#666", minHeight: 120, display: "grid", placeItems: "center", textAlign: "center" }}>
                  まだ設定されていません
                </div>
              )}
            </div>
          ))}
        </div>
        {clipsEditOpen && (
          <>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, fontWeight: 700 }}>保存棋譜から選ぶ</div>
            <ul style={{ display: "grid", gap: 8, width: "100%", paddingLeft: 18 }}>
              {rows.map(row => {
                const selected = featuredIds.includes(row.id);
                return (
                  <li key={row.id}>
                    <div><b>{matchNames[row.id] || "（名前なし）"}</b></div>
                    <div style={{ fontSize: 13 }}>
                      {new Date(row.created_at).toLocaleString()} / 勝者: {row.winner === "p1" ? "先手" : "後手"} / 手数: {row.moves_count}
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => onToggleFeaturedWithStar(row.id)} style={btnStyle}>
                        {selected ? "掲載を外す" : "厳選クリップに追加"}
                      </button>
                      <Link href={`/history/${row.id}`} style={btnStyle}>再生</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {status && (
        <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "rgba(255,255,255,0.6)", width: "100%", maxWidth: 760 }}>
          {status}
        </div>
      )}
    </main>
  );
}

function MiniBoard({ board }: { board: number[] }) {
  const cells = Array.isArray(board) && board.length === 25 ? board : Array.from({ length: 25 }, () => 0);
  return (
    <div style={miniBoardWrapStyle}>
      <div style={miniBoardStyle}>
        {cells.map((v, i) => (
          <div key={i} style={{ ...miniCellStyle, background: `rgba(120, 78, 40, ${0.08 + Math.min(5, Math.max(0, v)) * 0.14})` }}>
            <span style={{ fontSize: 9, color: v > 0 ? "#3b2713" : "#9b8a78" }}>{v > 0 ? v : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 760,
  display: "grid",
  gap: 8,
  padding: 12,
  border: "1px solid var(--line)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.6)",
};

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid var(--line)",
  background: "linear-gradient(180deg, #fff8ec 0%, #f1dfbf 100%)",
  cursor: "pointer",
  textDecoration: "none",
  color: "var(--ink)",
  boxShadow: "0 2px 0 rgba(120, 80, 40, 0.25)",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.9)",
  width: "100%",
  boxSizing: "border-box",
};

const frameStyle: React.CSSProperties = {
  border: "8px solid #9b6e3f",
  borderRadius: 12,
  background: "linear-gradient(180deg, #f7e6cf 0%, #edd0a9 100%)",
  boxShadow: "inset 0 0 0 2px #c79f6e, 0 3px 0 rgba(90, 50, 20, 0.25)",
  padding: 8,
  display: "grid",
  gap: 6,
  alignContent: "start",
  textAlign: "center",
};

const miniBoardWrapStyle: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  padding: 4,
};

const miniBoardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 22px)",
  gap: 2,
  border: "2px solid #7a532e",
  padding: 4,
  background: "linear-gradient(180deg, #f5deb9 0%, #e8c89a 100%)",
  borderRadius: 6,
};

const miniCellStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  border: "1px solid rgba(122,83,46,0.45)",
  borderRadius: 3,
  display: "grid",
  placeItems: "center",
};
