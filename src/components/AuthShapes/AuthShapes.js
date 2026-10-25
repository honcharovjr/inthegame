"use client";

import { useEffect, useRef } from "react";
import styles from "../AuthShell/AuthShell.module.css";

const between = (low, high) => low + Math.random() * (high - low);

// The three floating shapes of the auth screens. Every visit they start from
// a slightly different place and drift on a different path, but always in the
// same area of the screen. The values are set after the page is shown, so the
// server and the browser never disagree. The shapes fade in once they are set.
export default function AuthShapes() {
  const ref = useRef(null);

  useEffect(() => {
    const shapes = ref.current?.children ?? [];
    for (const shape of shapes) {
      shape.style.setProperty("--x", `${between(-36, 36).toFixed(0)}px`);
      shape.style.setProperty("--y", `${between(-44, 44).toFixed(0)}px`);
      // Starting part-way through the loop puts every shape elsewhere on its path
      shape.style.setProperty("--delay", `-${between(0, 12).toFixed(1)}s`);
      // Bigger or smaller sweeps, and a mirrored path half of the time
      shape.style.setProperty("--k", between(0.7, 1.5).toFixed(2));
      shape.style.setProperty("--flip", Math.random() < 0.5 ? "-1" : "1");
      shape.dataset.ready = "true";
    }
  }, []);

  return (
    <div ref={ref} className={styles.shapes} aria-hidden="true">
      <div className={styles.circle} />
      <div className={styles.square} />
      <div className={styles.block} />
    </div>
  );
}
