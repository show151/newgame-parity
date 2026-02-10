"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MatchRow = {
  id: string;
  created_at: string;
  winner: string;
  moves_count: number;
};

export default function HistoryPage() {
  const [status, setStatus] = useState<string>("");
  const [rows, setRows] = useState<MatchRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setStatus("未ログインです。ログインすると棋譜を見られます。");
        return;
      }

      const { data, error } = await supabase
        .from("matches")
        .select("id, created_at, winner, moves_count")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        setStatus("棋譜の取得に失敗しました。");
        return;
      }
      const list = (data ?? []) as MatchRow[];
      setRows(list);
      setStatus(list.length === 0 ? "棋譜がまだありません。" : "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24, display: "grid", gap: 12, justifyItems: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>保存棋譜</h1>
      {status && (
        <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "rgba(255,255,255,0.6)", width: "100%", maxWidth: 720 }}>
          {status}
        </div>
      )}
      <ul style={{ display: "grid", gap: 8, width: "100%", maxWidth: 720 }}>
        {rows.map(r => (
          <li key={r.id} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "rgba(255,255,255,0.6)" }}>
            <div><b>{new Date(r.created_at).toLocaleString()}</b></div>
            <div>勝者: {r.winner === "p1" ? "先手" : "後手"} / 手数: {r.moves_count}</div>
            <div style={{ fontSize: 12, color: "#666" }}>棋譜ID: {r.id}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
