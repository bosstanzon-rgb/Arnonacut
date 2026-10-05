"use client";

import { ErrorState } from "@/components/states";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      message={error.message}
      onRetry={reset}
    />
  );
}
