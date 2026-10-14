import type { Metadata } from "next";
import { ServicePage, serviceMetadata } from "@/components/v2/service-page";

export const metadata: Metadata = serviceMetadata("security");

export default function Page() {
  return <ServicePage slug="security" />;
}
