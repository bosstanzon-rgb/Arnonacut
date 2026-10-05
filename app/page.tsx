import { Suspense } from "react";
import { CategoryFilter } from "@/components/category-filter";
import { NewsFeed } from "@/components/news-feed";
import { listArticles } from "@/lib/articles";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : undefined;
  const articles = listArticles(category);

  return (
    <div>
      <section className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">
          Live feed
        </p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight text-stone-950 sm:text-4xl">
          Latest from Israel
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-500">
          Short English headlines and summaries. Open a story for the source
          link and original time.
        </p>
      </section>
      <div className="mb-6">
        <Suspense fallback={null}>
          <CategoryFilter active={category} />
        </Suspense>
      </div>
      <NewsFeed articles={articles} />
    </div>
  );
}
