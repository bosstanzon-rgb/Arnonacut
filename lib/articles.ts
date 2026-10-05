import { MOCK_ARTICLES } from "./mock-articles";
import {
  CATEGORIES,
  IMPORTANCE_LEVELS,
  type Article,
  type Category,
  type ImportanceLevel,
} from "./types";

const IMPORTANCE_RANK: Record<ImportanceLevel, number> = {
  BREAKING: 0,
  MAJOR: 1,
  UPDATE: 2,
  OTHER: 3,
};

export function isCategory(value: string | undefined): value is Category {
  return CATEGORIES.includes(value as Category);
}

export function isImportance(value: string): value is ImportanceLevel {
  return IMPORTANCE_LEVELS.includes(value as ImportanceLevel);
}

export function sortFeed(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    const rank = IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance];
    if (rank !== 0) return rank;
    return (
      Date.parse(b.originalPublishedAt) - Date.parse(a.originalPublishedAt)
    );
  });
}

export function listArticles(category?: string): Article[] {
  const sorted = sortFeed(MOCK_ARTICLES);
  if (!category || category === "All" || !isCategory(category)) {
    return sorted;
  }
  return sorted.filter((article) => article.category === category);
}

export function getArticle(id: string): Article | undefined {
  return MOCK_ARTICLES.find((article) => article.id === id);
}
