import type { Metadata } from "next";
import ApplyForm from "./apply-form";
import { openPositions, turnstileSiteKey, uploadConfig } from "@/lib/careers/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Apply online | Security guard jobs | SDC Careers",
  description:
    "Apply to SDC Security & Facility Services in English, Kannada or Hindi. Security guard, lady guard, supervisor, housekeeping and driver jobs in Bengaluru. No CV needed.",
  alternates: { canonical: "/careers/apply" },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [openings, params] = await Promise.all([openPositions(), searchParams]);
  const opening = typeof params.opening === "string" && /^[0-9a-f-]{36}$/.test(params.opening) ? params.opening : null;
  return <ApplyForm openings={openings} upload={uploadConfig()} turnstileSiteKey={turnstileSiteKey()} initialOpening={opening} />;
}
