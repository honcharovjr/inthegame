"use client";

import { useEffect } from "react";

// Brings the element with this id into view once it is on the page, such as
// a session opened from Home.
export default function ScrollIntoView({ id }) {
  useEffect(() => {
    document.getElementById(id)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [id]);
  return null;
}
