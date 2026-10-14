import type { Metadata } from "next";
import { ServicePage, serviceMetadata } from "@/components/v2/service-page";

export const metadata: Metadata = serviceMetadata("manpower");

export default function Page() {
  return <ServicePage slug="manpower" />;
}
