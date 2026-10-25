"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar/Avatar";
import styles from "./flow.module.css";

const ROW = 64;
const GAP = 8;
const STEP = ROW + GAP;

function move(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Places by drag and drop. The order of the list is the order of the places.
// Grab the handle on the right and drag, or focus it and use the arrow keys.
// A player can be marked as tied with the one above.
export default function RankingList({
  participants,
  order,
  places,
  tied,
  onOrder,
  onTied,
}) {
  const [drag, setDrag] = useState(null);
  const byKey = Object.fromEntries(participants.map((p) => [p.key, p]));
  const count = order.length;

  function startDrag(event, key) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      key,
      startIndex: order.indexOf(key),
      startY: event.clientY,
      offset: 0,
    });
  }

  function moveDrag(event) {
    if (!drag) return;
    const offset = event.clientY - drag.startY;
    const current = order.indexOf(drag.key);
    const target = Math.max(
      0,
      Math.min(count - 1, Math.round(drag.startIndex + offset / STEP)),
    );
    if (target !== current) {
      onOrder(move(order, current, target));
    }
    setDrag({ ...drag, offset });
  }

  function endDrag() {
    setDrag(null);
  }

  function onKeyDown(event, key) {
    const current = order.indexOf(key);
    if (event.key === "ArrowUp" && current > 0) {
      event.preventDefault();
      onOrder(move(order, current, current - 1));
    }
    if (event.key === "ArrowDown" && current < count - 1) {
      event.preventDefault();
      onOrder(move(order, current, current + 1));
    }
  }

  return (
    <ul
      className={styles.rankBox}
      style={{ height: count * STEP - GAP }}
      aria-label="Places. Drag to reorder."
    >
      {participants.map((p) => {
        const index = order.indexOf(p.key);
        const dragging = drag?.key === p.key;
        const y = dragging
          ? index * STEP + drag.offset - (index - drag.startIndex) * STEP
          : index * STEP;
        const place = places[p.key];
        const first = place === 1;

        return (
          <li
            key={p.key}
            className={`${styles.rankRow} ${first ? styles.rowWin : ""} ${dragging ? styles.rankDragging : ""}`}
            style={{ height: ROW, transform: `translateY(${y}px)` }}
          >
            <span className={styles.rank} aria-hidden="true">
              {place}
            </span>
            <Avatar name={p.name} size={40} color={p.color} />
            <span className={styles.rowText}>
              <span className={styles.rowName}>{p.name}</span>
            </span>
            {first && (
              <span className={styles.trophy} role="img" aria-label="Winner">
                🏆
              </span>
            )}
            {index > 0 && (
              <button
                type="button"
                className={`${styles.tieButton} ${tied[p.key] ? styles.tieOn : ""}`}
                aria-pressed={Boolean(tied[p.key])}
                onClick={() => onTied(p.key)}
              >
                Tie
              </button>
            )}
            <button
              type="button"
              className={styles.handle}
              aria-label={`Move ${p.name}, now place ${place}. Use the arrow keys.`}
              onPointerDown={(event) => startDrag(event, p.key)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={(event) => onKeyDown(event, p.key)}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 8h14M5 12h14M5 16h14" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
