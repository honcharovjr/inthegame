"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./TipLayer.module.css";

// Room between the element and its tip, and between a tip and the screen edge.
const GAP = 8;
const EDGE = 8;

// The tooltips of the app. Any element with data-tip shows it on hover and on
// keyboard focus. The tip floats over the whole page, so a block that hides
// its overflow cannot cut it off. data-tip-pos="below" prefers the space under
// the element; a tip that does not fit flips to the other side and slides
// along the edge to stay on screen.
export default function TipLayer() {
  const [target, setTarget] = useState(null);
  const bubble = useRef(null);

  useEffect(() => {
    const tipOf = (node) => node?.closest?.("[data-tip]") ?? null;
    const over = (event) => {
      const el = tipOf(event.target);
      setTarget(el?.getAttribute("data-tip") ? el : null);
    };
    const focus = (event) => {
      const el = tipOf(event.target);
      if (el?.getAttribute("data-tip") && event.target.matches(":focus-visible")) setTarget(el);
    };
    const hide = () => setTarget(null);

    document.addEventListener("pointerover", over);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", hide);
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  // Placed once its size is known, before the browser paints it.
  useLayoutEffect(() => {
    const tip = bubble.current;
    if (!target || !tip) return;
    const box = target.getBoundingClientRect();
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const roomAbove = box.top - GAP - height >= EDGE;
    const roomBelow = box.bottom + GAP + height <= window.innerHeight - EDGE;
    const wantsBelow = target.getAttribute("data-tip-pos") === "below";
    const below = wantsBelow ? roomBelow || !roomAbove : !roomAbove && roomBelow;
    const left = Math.min(
      Math.max(box.left + box.width / 2 - width / 2, EDGE),
      window.innerWidth - width - EDGE,
    );
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(below ? box.bottom + GAP : box.top - GAP - height)}px`;
    tip.dataset.side = below ? "below" : "above";
  }, [target]);

  if (!target) return null;
  return (
    <div ref={bubble} className={styles.tip} role="tooltip">
      {target.getAttribute("data-tip")}
    </div>
  );
}
