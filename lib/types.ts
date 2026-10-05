export const CATEGORIES = [
  "Security",
  "Politics",
  "Israel",
  "Economy",
  "Society",
  "Technology",
  "International",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const IMPORTANCE_LEVELS = [
  "BREAKING",
  "MAJOR",
  "UPDATE",
  "OTHER",
] as const;

export type ImportanceLevel = (typeof IMPORTANCE_LEVELS)[number];

/** Matches the planned `articles` table in supabase/schema.sql */
export type Article = {
  id: string;
  headlineEn: string;
  summaryEn: string;
  sourceName: string;
  originalPublishedAt: string;
  category: Category;
  importance: ImportanceLevel;
  originalUrl: string;
};
