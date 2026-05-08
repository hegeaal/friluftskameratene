"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewTripPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/tur/${crypto.randomUUID()}`);
  }, [router]);

  return null;
}
