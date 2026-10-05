import Link from "next/link";
import { ImportanceBadge } from "@/components/importance-badge";
import { formatRelativeTime } from "@/lib/format";
import type { Article } from "@/lib/types";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="border-b border-stone-200/80 py-5 first:pt-0">
      <Link href={`/article/${article.id}`} className="group block">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ImportanceBadge level={article.importance} />
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
            {article.category}
          </span>
        </div>
        <h2 className="font-serif text-[1.35rem] leading-snug tracking-tight text-stone-950 group-hover:text-stone-700 sm:text-[1.5rem]">
          {article.headlineEn}
        </h2>
        <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-stone-600">
          {article.summaryEn}
        </p>
        <p className="mt-3 text-xs text-stone-500">
          <span className="font-medium text-stone-700">{article.sourceName}</span>
          <span className="mx-1.5 text-stone-300">·</span>
          <time dateTime={article.originalPublishedAt}>
            {formatRelativeTime(article.originalPublishedAt)}
          </time>
        </p>
      </Link>
    </article>
  );
}
