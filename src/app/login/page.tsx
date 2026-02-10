"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setCurrentUser(data.user?.email ?? null);
      } catch {
        setStatus("ログイン機能は現在利用できません。");
      }
    })();
  }, []);

  const signIn = async () => {
    if (!email || !password) {
      setStatus("メールアドレスとパスワードを入力してください。");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setCurrentUser(data.user?.email ?? null);
      setStatus("ログインしました。");
    } catch {
      setStatus("ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    if (!email || !password) {
      setStatus("メールアドレスとパスワードを入力してください。");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setCurrentUser(data.user?.email ?? null);
      setStatus("登録しました。確認メールが届く場合は確認してください。");
    } catch {
      setStatus("登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setStatus("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      setStatus("ログアウトしました。");
    } catch {
      setStatus("ログアウトに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, display: "grid", gap: 12, maxWidth: 420, justifyItems: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>ログイン</h1>

      <div style={{ display: "grid", gap: 8, width: "100%" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>メールアドレス</span>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>パスワード</span>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            style={inputStyle}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={signIn} disabled={loading} style={btnStyle}>
          ログイン
        </button>
        <button onClick={signUp} disabled={loading} style={btnStyle}>
          新規登録
        </button>
        <button onClick={signOut} disabled={loading} style={btnStyle}>
          ログアウト
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" style={btnStyle}>
          戻る
        </Link>
      </div>

      <div style={{ fontSize: 14, color: "#555", textAlign: "center" }}>
        {currentUser ? `ログイン中: ${currentUser}` : "未ログインです。"}
      </div>
      {status && (
        <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "rgba(255,255,255,0.6)", width: "100%" }}>
          {status}
        </div>
      )}
    </main>
  );
}

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
  background: "rgba(255,255,255,0.8)",
};
