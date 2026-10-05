import { FeedSkeleton } from "@/components/states";

export default function DemoLoadingPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-stone-950">Loading state</h1>
      <FeedSkeleton />
    </div>
  );
}
