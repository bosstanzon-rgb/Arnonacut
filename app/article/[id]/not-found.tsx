import { EmptyState } from "@/components/states";

export default function ArticleNotFound() {
  return (
    <EmptyState
      title="Story not found"
      detail="This headline is not in the current feed. It may have been removed or the link is incomplete."
    />
  );
}
