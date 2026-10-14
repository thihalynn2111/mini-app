"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoLogout() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Cookie ကို ဖျက်ခြင်း
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push("/auth/login");
      router.refresh();
    }, 5000); // ၅ စက္ကန့်

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
