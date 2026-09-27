"use client";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { homeFor } from "@/lib/navigation";

/** Sends visitors to their role's home screen, or to sign-in. */
export default function Entry() {
  useEffect(() => {
    fetch("/api/foundation/context", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) return "/login";
        const d = (await r.json()) as { memberships?: { role: string }[] };
        return homeFor(d.memberships?.[0]?.role);
      })
      .catch(() => "/login")
      .then((to) => window.location.replace(to));
  }, []);
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f3f6fa", color: "#3d526d", fontFamily: "DM Sans, system-ui, sans-serif" }}>
      <p style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <LoaderCircle size={18} style={{ animation: "spin 0.8s linear infinite" }} /> Opening your workspace…
      </p>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </main>
  );
}
