import { ArticleCard } from "@/components/article-card";
import { EmptyState } from "@/components/states";
import type { Article } from "@/lib/types";

export function NewsFeed({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
