"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

const FILTERS = ["All", ...CATEGORIES] as const;

export function CategoryFilter({ active }: { active?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = active && active !== "All" ? active : "All";

  function hrefFor(filter: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "All") {
      params.delete("category");
    } else {
      params.set("category", filter);
    }
    const query = params.toString();
    const base = pathname === "/" ? "/" : pathname;
    return query ? `${base}?${query}` : base;
  }

  return (
    <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex w-max gap-1.5 pb-1">
        {FILTERS.map((filter) => {
          const selected = current === filter;
          return (
            <li key={filter}>
              <Link
                href={hrefFor(filter)}
                scroll={false}
                className={
                  selected
                    ? "inline-flex rounded-full bg-stone-950 px-3 py-1.5 text-xs font-medium text-white"
                    : "inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
                }
                aria-current={selected ? "page" : undefined}
              >
                {filter}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
