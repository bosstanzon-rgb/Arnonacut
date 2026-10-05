import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImportanceBadge } from "@/components/importance-badge";
import { getArticle } from "@/lib/articles";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/article/[id]">): Promise<Metadata> {
  const { id } = await params;
  const article = getArticle(id);
  if (!article) return { title: "Story not found" };
  return { title: article.headlineEn };
}

export default async function ArticlePage({
  params,
}: PageProps<"/article/[id]">) {
  const { id } = await params;
  const article = getArticle(id);
  if (!article) notFound();

  return (
    <article>
      <p className="mb-6">
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500 hover:text-stone-900"
        >
          ← Live feed
        </Link>
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ImportanceBadge level={article.importance} />
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
          {article.category}
        </span>
      </div>
      <h1 className="font-serif text-[1.75rem] leading-snug tracking-tight text-stone-950 sm:text-4xl">
        {article.headlineEn}
      </h1>
      <p className="mt-4 text-sm text-stone-500">
        <span className="font-medium text-stone-800">{article.sourceName}</span>
        <span className="mx-1.5 text-stone-300">·</span>
        <time dateTime={article.originalPublishedAt}>
          {formatAbsoluteTime(article.originalPublishedAt)} Israel time
        </time>
        <span className="mx-1.5 text-stone-300">·</span>
        {formatRelativeTime(article.originalPublishedAt)}
      </p>
      <p className="mt-6 text-[1.05rem] leading-relaxed text-stone-700">
        {article.summaryEn}
      </p>
      <p className="mt-8 border-t border-stone-200 pt-6 text-sm text-stone-500">
        Full article is not republished here.
      </p>
      <p className="mt-3">
        <a
          href={article.originalUrl}
          className="inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
          rel="noopener noreferrer"
          target="_blank"
        >
          Read at {article.sourceName}
        </a>
      </p>
    </article>
  );
}
