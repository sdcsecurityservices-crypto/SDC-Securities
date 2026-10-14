import type { Metadata } from "next";
import { BASE, clients } from "@/components/v2/data";
import { WallOfHonour } from "@/components/v2/wall";
import { Accent, Breadcrumbs, Btn, CtaBand, Eyebrow, Numeral, Rule } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Clients",
  description:
    "Organisations SDC Security & Facility Services has served across Karnataka, from Namma Metro, KPTCL and Lamborghini Bangalore to hospitals, medical colleges, manufacturers and residential developers.",
};

export default function ClientsPage() {
  return (
    <>
      <section className="v2-honour-page v2-dark" aria-labelledby="v2-page-title">
        <div className="v2-wrap">
          <Breadcrumbs items={[{ label: "About", href: `${BASE}/about` }, { label: "Clients" }]} />
          <div className="v2-honour-head">
            <div>
              <Rule />
              <Eyebrow>Wall of honour</Eyebrow>
              <h1 className="v2-h1 v2-h1--xl" id="v2-page-title">
                From Namma Metro to Lamborghini Bangalore: <Accent>trusted where it matters.</Accent>
              </h1>
            </div>
            <div className="v2-honour-count">
              <Numeral value="50+" className="v2-big-num" />
              <p>
                organisations across Karnataka. {clients.length} of them are named here, from public infrastructure to
                the places people call home.
              </p>
            </div>
          </div>
          <WallOfHonour mode="full" />
          <div className="v2-honour-foot">
            <p className="v2-mono-cap">Organisations SDC has served, past and present. Logos belong to their respective owners.</p>
            <Btn href={`${BASE}/industries`} variant="secondary">
              How we serve each sector
            </Btn>
          </div>
        </div>
      </section>

      <CtaBand
        title={
          <>
            Your site, <Accent>next on the wall.</Accent>
          </>
        }
      />
    </>
  );
}
