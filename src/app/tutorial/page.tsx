export default function TutorialPage() {
  return (
    <main style={{ padding: 24, display: "grid", gap: 12, lineHeight: 1.8, justifyItems: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>一正（hisei）チュートリアル</h1>

      <h2 style={{ fontSize: 18, fontWeight: 800 }}>マスの数字</h2>
      <ul style={{ width: "100%", maxWidth: 720 }}>
        <li><b>0</b>: 空マス</li>
        <li><b>先手</b>: <b>2</b> / <b>4</b></li>
        <li><b>後手</b>: <b>1</b> / <b>3</b> / <b>5</b></li>
        <li><b>5</b>: ロック（これ以上増えない）</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 800 }}>手番でできること</h2>
      <ul style={{ width: "100%", maxWidth: 720 }}>
        <li>空マスに自分の石を1つ置きます。</li>
        <li>先手は <b>2</b>、後手は <b>1</b> を置きます。</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 800 }}>取り込み（8方向）</h2>
      <p style={{ width: "100%", maxWidth: 720 }}>
        置いたマスから8方向に見て、相手の石が並んだ先に自分の石がある場合、
        その間の相手の石を「取り込み」ます。
        取り込まれた石は <b>+1</b> されます（最大5）。<b>5</b> はロックのため増えません。
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 800 }}>勝利条件</h2>
      <p style={{ width: "100%", maxWidth: 720 }}>
        縦・横・斜めのいずれか1列がすべて自分の数字になったら勝ちです。
        先手は <b>{`{2,4}`}</b>、後手は <b>{`{1,3,5}`}</b> の集合で判定します。
      </p>
    </main>
  );
}
