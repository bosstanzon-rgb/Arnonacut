import Link from "next/link";
import { EmptyState } from "@/components/states";

export default function NotFound() {
  return (
    <div>
      <EmptyState
        title="Page not found"
        detail="That link does not match a story or page in this app."
      />
      <p className="mt-4 text-center">
        <Link href="/" className="text-sm font-medium text-stone-900 underline">
          Back to live feed
        </Link>
      </p>
    </div>
  );
}
