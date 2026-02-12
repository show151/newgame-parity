"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getFeaturedMatchIds, getMatchNames, toggleFeaturedMatch } from "@/lib/profilePrefs";

type MatchRow = {
  id: string;
  created_at: string;
  winner: string;
  moves_count: number;
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
      const featured = getFeaturedMatchIds(auth.user.id);
      setMatchNames(names);
      setFeaturedIds(featured);

      const { data, error } = await supabase
        .from("matches")
        .select("id, created_at, winner, moves_count")
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

  const onToggleFeatured = (matchId: string) => {
    if (!userId) return;
    const result = toggleFeaturedMatch(userId, matchId);
    if (!result.ok) {
      setStatus("厳選クリップは3件まで選択できます。");
      return;
    }
    setFeaturedIds(result.featuredIds);
  };

  return (
    <main style={{ padding: 24, display: "grid", gap: 12, justifyItems: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>プロフィール</h1>

      <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
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
        <div style={{ fontSize: 13, color: "#666" }}>ログイン中: {email || "(不明)"}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={saveProfile} disabled={saving} style={btnStyle}>
            {saving ? "保存中..." : "プロフィールを保存"}
          </button>
          <button onClick={logout} disabled={loggingOut} style={btnStyle}>
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
          <Link href="/" style={btnStyle}>ホームへ戻る</Link>
          <Link href="/history" style={btnStyle}>保存棋譜へ</Link>
        </div>
      </div>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0, fontSize: 20 }}>厳選クリップ</h2>
        <div style={{ fontSize: 14, color: "#666" }}>{featuredRows.length}/3 件</div>
        {featuredRows.length === 0 && (
          <div>まだ選択されていません。下の保存棋譜一覧から選んでください。</div>
        )}
        <ul style={{ display: "grid", gap: 8, width: "100%", paddingLeft: 18 }}>
          {featuredRows.map(row => (
            <li key={row.id}>
              <div><b>{matchNames[row.id] || "（名前なし）"}</b></div>
              <div style={{ fontSize: 13 }}>
                {new Date(row.created_at).toLocaleString()} / 勝者: {row.winner === "p1" ? "先手" : "後手"} / 手数: {row.moves_count}
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href={`/history/${row.id}`} style={btnStyle}>再生</Link>
                <button onClick={() => onToggleFeatured(row.id)} style={btnStyle}>掲載を外す</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0, fontSize: 20 }}>保存棋譜から選ぶ</h2>
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
                  <button onClick={() => onToggleFeatured(row.id)} style={btnStyle}>
                    {selected ? "掲載を外す" : "厳選クリップに追加"}
                  </button>
                  <Link href={`/history/${row.id}`} style={btnStyle}>再生</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {status && (
        <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "rgba(255,255,255,0.6)", width: "100%", maxWidth: 760 }}>
          {status}
        </div>
      )}
    </main>
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
