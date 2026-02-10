import { supabase } from "@/lib/supabaseClient";
import type { Player } from "@/lib/gameLogic";

export type MoveRecord = {
  ply: number;
  player: Player;
  pos: number;
  diff: Array<{ i: number; from: number; to: number }>;
  board_after: number[];
};

export async function saveMatchToSupabase(args: {
  winner: Player;
  final_board: number[];
  moves: MoveRecord[];
}) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { ok: false as const, reason: "未ログインのため保存しません" };

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .insert({
      user_id: user.id,
      winner: args.winner,
      final_board: args.final_board,
      moves_count: args.moves.length,
    })
    .select()
    .single();

  if (matchErr) return { ok: false as const, reason: matchErr.message };

  const payload = args.moves.map(m => ({
    match_id: match.id,
    ply: m.ply,
    player: m.player,
    pos: m.pos,
    diff: m.diff,
    board_after: m.board_after,
  }));

  const { error: movesErr } = await supabase.from("moves").insert(payload);
  if (movesErr) return { ok: false as const, reason: movesErr.message };

  return { ok: true as const, matchId: match.id };
}
