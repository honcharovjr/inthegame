"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { useFilterLoading } from "@/components/FilterLoading/FilterLoading";
import styles from "./Pager.module.css";

// Previous and next page around "page 2 of 5". filter: the page sits in
// FilterLoading, so a new page shows its skeleton while it loads.
export default function Pager({ page, total, prevHref, nextHref, filter = false }) {
  const { go } = useFilterLoading();

  function step(href) {
    return (
      <Link
        href={href}
        scroll={false}
        className={`${styles.step} btn-secondary`}
        onClick={(event) => {
          if (!filter || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
          event.preventDefault();
          go(href);
        }}
      >
        {href === prevHref ? (
          <>
            <ArrowLeftIcon size={18} />
            Previous
          </>
        ) : (
          <>
            Next
            <span className={styles.flip}>
              <ArrowLeftIcon size={18} />
            </span>
          </>
        )}
      </Link>
    );
  }

  return (
    <nav className={styles.pager} aria-label="Pages">
      {page > 1 ? step(prevHref) : <span />}
      <span className={styles.where}>
        Page {page} of {total}
      </span>
      {page < total ? step(nextHref) : <span />}
    </nav>
  );
}
