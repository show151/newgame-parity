import { applyMove, checkWinner, type Player, ownerOf, SIZE, idx } from "./gameLogic";

export type CpuLevel = "easy" | "medium" | "hard";

export function findCpuMove(board: number[], player: Player, level: CpuLevel = "hard"): number {
  if (level === "easy") return findEasyMove(board, player);
  if (level === "medium") return findMediumMove(board, player);
  return findHardMove(board, player);
}

// 初級：ランダム + 即勝ち手のみ
function findEasyMove(board: number[], player: Player): number {
  const emptyPositions = board.map((v, i) => (v === 0 ? i : -1)).filter(i => i >= 0);
  if (emptyPositions.length === 0) return -1;

  // 勝てる手があれば打つ
  for (const pos of emptyPositions) {
    const res = applyMove(board, pos, player);
    if (res.ok && res.winner === player) return pos;
  }

  // ランダムに選ぶ
  return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
}

// 中級：即勝ち + 防御 + 簡易評価
function findMediumMove(board: number[], player: Player): number {
  const emptyPositions = board.map((v, i) => (v === 0 ? i : -1)).filter(i => i >= 0);
  if (emptyPositions.length === 0) return -1;

  // 勝てる手があれば打つ
  for (const pos of emptyPositions) {
    const res = applyMove(board, pos, player);
    if (res.ok && res.winner === player) return pos;
  }

  // 相手が次に勝つ手を防ぐ
  const opponent: Player = player === "p1" ? "p2" : "p1";
  for (const pos of emptyPositions) {
    const res = applyMove(board, pos, opponent);
    if (res.ok && res.winner === opponent) return pos;
  }

  // 評価関数で選ぶ
  let bestPos = emptyPositions[0];
  let bestScore = -Infinity;

  for (const pos of emptyPositions) {
    const res = applyMove(board, pos, player);
    if (!res.ok) continue;

    const score = evaluateBoard(res.newBoard, player);
    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }

  return bestPos;
}

// 上級：ミニマックス法
function findHardMove(board: number[], player: Player): number {
  const emptyPositions = board.map((v, i) => (v === 0 ? i : -1)).filter(i => i >= 0);
  if (emptyPositions.length === 0) return -1;

  // 即勝ち手があれば打つ
  for (const pos of emptyPositions) {
    const res = applyMove(board, pos, player);
    if (res.ok && res.winner === player) return pos;
  }

  // ミニマックス探索
  const MAX_DEPTH = 4;
  let bestPos = emptyPositions[0];
  let bestScore = -Infinity;

  for (const pos of emptyPositions) {
    const res = applyMove(board, pos, player);
    if (!res.ok) continue;

    const score = minimax(res.newBoard, MAX_DEPTH - 1, -Infinity, Infinity, false, player);
    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }

  return bestPos;
}

function minimax(
  board: number[],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  cpuPlayer: Player
): number {
  const winner = checkWinner(board);
  if (winner === cpuPlayer) return 10000 + depth;
  if (winner !== null) return -10000 - depth;
  if (depth === 0) return evaluateBoard(board, cpuPlayer);

  const emptyPositions = board.map((v, i) => (v === 0 ? i : -1)).filter(i => i >= 0);
  if (emptyPositions.length === 0) return 0;

  const currentPlayer: Player = isMaximizing ? cpuPlayer : (cpuPlayer === "p1" ? "p2" : "p1");

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const pos of emptyPositions) {
      const res = applyMove(board, pos, currentPlayer);
      if (!res.ok) continue;
      const score = minimax(res.newBoard, depth - 1, alpha, beta, false, cpuPlayer);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const pos of emptyPositions) {
      const res = applyMove(board, pos, currentPlayer);
      if (!res.ok) continue;
      const score = minimax(res.newBoard, depth - 1, alpha, beta, true, cpuPlayer);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

function evaluateBoard(board: number[], player: Player): number {
  let score = 0;
  const opponent: Player = player === "p1" ? "p2" : "p1";

  const lines: number[][] = [];
  for (let r = 0; r < SIZE; r++) {
    const line: number[] = [];
    for (let c = 0; c < SIZE; c++) line.push(idx(r, c));
    lines.push(line);
  }
  for (let c = 0; c < SIZE; c++) {
    const line: number[] = [];
    for (let r = 0; r < SIZE; r++) line.push(idx(r, c));
    lines.push(line);
  }
  lines.push([idx(0, 0), idx(1, 1), idx(2, 2), idx(3, 3), idx(4, 4)]);
  lines.push([idx(0, 4), idx(1, 3), idx(2, 2), idx(3, 1), idx(4, 0)]);

  for (const line of lines) {
    let myCount = 0;
    let oppCount = 0;

    for (const i of line) {
      const owner = ownerOf(board[i]);
      if (owner === player) myCount++;
      else if (owner === opponent) oppCount++;
    }

    if (oppCount === 0 && myCount > 0) {
      score += myCount * myCount * 20;
    }
    if (myCount === 0 && oppCount > 0) {
      score -= oppCount * oppCount * 20;
    }
  }

  const center = idx(2, 2);
  if (ownerOf(board[center]) === player) score += 30;

  return score;
}
