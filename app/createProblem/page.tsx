"use client";

// Creation lives in the dashboard centre so an in-flight creation (the
// transcription and analysis pipeline) survives without a navigation.
// This route stays for old links and forwards there.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateProblem() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
