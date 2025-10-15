"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuestionsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/questions/new');
  }, [router]);

  return null;
}
