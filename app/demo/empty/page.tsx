import { NewsFeed } from "@/components/news-feed";

export default function DemoEmptyPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-stone-950">Empty state</h1>
      <NewsFeed articles={[]} />
    </div>
  );
}
