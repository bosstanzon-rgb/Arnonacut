"use client";

import { useSyncExternalStore } from "react";
import { FeedSkeleton } from "@/components/states";

const emptySubscribe = () => () => {};

export default function DemoErrorPage() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (isClient) {
    throw new Error("Sample feed error for the error state preview.");
  }

  return <FeedSkeleton />;
}
