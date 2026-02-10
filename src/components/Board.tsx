"use client";

import React from "react";
import { BOARD_LEN, SIZE } from "@/lib/gameLogic";

type Props = {
  board: number[];
  onClickCell: (i: number) => void;
  lastChanged?: Set<number>;
  disabled?: boolean;
};

export default function Board({ board, onClickCell, lastChanged, disabled }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${SIZE}, min(64px, 12vw))`,
        gap: "min(8px, 2vw)",
        userSelect: "none",
        padding: "min(10px, 2.5vw)",
        borderRadius: 14,
        border: "2px solid var(--line)",
        background: "linear-gradient(180deg, #f5deb9 0%, #e8c89a 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        width: "fit-content",
        margin: "0 auto",
      }}
    >
      {Array.from({ length: BOARD_LEN }, (_, i) => {
        const v = board[i];
        const highlight = lastChanged?.has(i);
        return (
          <button
            key={i}
            onClick={() => onClickCell(i)}
            disabled={disabled}
            style={{
              width: "min(64px, 12vw)",
              height: "min(64px, 12vw)",
              borderRadius: 10,
              border: "2px solid var(--line)",
              fontSize: "clamp(16px, 3vw, 22px)",
              fontWeight: 700,
              background: highlight ? "var(--highlight)" : "var(--cell)",
              color: "var(--cell-ink)",
              cursor: disabled ? "not-allowed" : "pointer",
              boxShadow: "0 1px 0 rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
            aria-label={`cell-${i}`}
            title={`index=${i}`}
          >
            {v === 0 ? "" : v}
          </button>
        );
      })}
    </div>
  );
}
