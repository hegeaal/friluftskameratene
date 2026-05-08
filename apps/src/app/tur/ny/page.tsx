"use client";

import dynamic from "next/dynamic";

const TurNyClient = dynamic(() => import("@/components/TurNyClient"), { ssr: false });

export default function NewTripPage() {
  return <TurNyClient />;
}
