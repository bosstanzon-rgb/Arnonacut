export function EmptyState({
  title = "No stories in this view",
  detail = "Try another category, or go back to the full live feed.",
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-5 py-14 text-center"
    >
      <p className="font-serif text-xl text-stone-950">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
        {detail}
      </p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50/70 px-5 py-12 text-center"
    >
      <p className="font-serif text-xl text-stone-950">Unable to load stories</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
        {message || "Something went wrong while loading this page. Please try again."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-stone-950 px-4 py-2 text-xs font-medium text-white"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading stories" className="space-y-8 pt-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="animate-pulse border-b border-stone-200/80 pb-8">
          <div className="h-4 w-28 rounded bg-stone-200" />
          <div className="mt-3 h-7 w-full rounded bg-stone-200" />
          <div className="mt-2 h-7 w-4/5 rounded bg-stone-200" />
          <div className="mt-4 h-4 w-full rounded bg-stone-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}
