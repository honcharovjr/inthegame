"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition } from "react";
import Chip from "@/components/Chip/Chip";

const FilterContext = createContext({ pending: false, go: () => {} });

// Wraps a page that filters by address: the filters, and below them the
// results. Changing a filter goes through go(), and while the new results are
// on their way, FilterBody shows a skeleton so nobody wonders if it worked.
export function FilterLoading({ children }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(href, { replace = false } = {}) {
    startTransition(() => {
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }

  return (
    <FilterContext value={{ pending, go }}>{children}</FilterContext>
  );
}

export function useFilterLoading() {
  return useContext(FilterContext);
}

// A chip that changes the filter. A click with a modifier key, such as open in
// a new tab, is left to the browser.
export function FilterChip({ href, ...props }) {
  const { go } = useFilterLoading();

  return (
    <Chip
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
        event.preventDefault();
        go(href);
      }}
      {...props}
    />
  );
}

// The results. A skeleton stands in for them while a filter is loading.
export function FilterBody({ skeleton, children }) {
  const { pending } = useFilterLoading();
  return pending ? skeleton : children;
}
