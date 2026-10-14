import type { Metadata } from "next";
import CareersHome from "./careers-home";
import { openPositions } from "@/lib/careers/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Careers | Security guard & lady guard jobs in Bengaluru | SDC",
  description:
    "Security guard, lady guard, supervisor and housekeeping jobs in Bengaluru and Karnataka with SDC Security & Facility Services. EPF & ESI, training, uniform. Ex-servicemen especially welcome. Apply online in English, Kannada or Hindi.",
  alternates: { canonical: "/careers" },
  openGraph: { title: "Careers at SDC | Serve with pride. Grow with purpose.", url: "/careers" },
};

export default async function Page() {
  const openings = await openPositions();
  return <CareersHome openings={openings} />;
}
