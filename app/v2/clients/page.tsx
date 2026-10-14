import type { Metadata } from "next";
import Link from "next/link";
import { BASE, clientGroups, industries } from "@/components/v2/data";
import { Accent, CheckList, CtaBand, IndustryCard, LogoTile, PageHero, Section, SectionHead } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Clients",
  description:
    "Organisations SDC Security & Facility Services has served across Karnataka, from Namma Metro and KPTCL to hospitals, medical colleges, manufacturers and residential developers.",
};

export default function ClientsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Company" }, { label: "Clients" }]}
        eyebrow="Trusted where it matters"
        title={
          <>
            Infrastructure, healthcare, <Accent>industry and homes.</Accent>
          </>
        }
        lead="From a metro rail system and the state power utility to hospitals, medical colleges, manufacturers and apartment communities. A selection of the organisations SDC has served across Karnataka."
        aside={
          <div className="v2-hero-facts">
            <h2>50+ organisations served</h2>
            <CheckList tone="dark" items={clientGroups.map((g) => g.sector)} />
          </div>
        }
      />

      <Section tone="white" labelledBy="cl-wall">
        <SectionHead
          id="cl-wall"
          eyebrow="Our clientele"
          title={
            <>
              Experience across sectors. <Accent>Relationships built on service.</Accent>
            </>
          }
          lead="Grouped by sector, from public infrastructure to the places people call home."
        />
        <div className="v2-client-groups">
          {clientGroups.map((g) => (
            <section key={g.sector} className="v2-client-group" aria-labelledby={`cg-${g.sector.replace(/\W+/g, "-")}`}>
              <h3 id={`cg-${g.sector.replace(/\W+/g, "-")}`}>
                {g.sector}
                <span>{g.clients.length}<span className="v2-sr"> organisations</span></span>
              </h3>
              <ul className="v2-logos">
                {g.clients.map((c) => (
                  <LogoTile key={c.name} client={c} />
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="v2-fineprint">
          Organisations SDC has served, past and present. Logos belong to their respective owners.
        </p>
      </Section>

      <Section tone="light" labelledBy="cl-sectors">
        <SectionHead
          id="cl-sectors"
          eyebrow="Where we work"
          title={
            <>
              See how we serve <Accent>your sector.</Accent>
            </>
          }
          lead={`Each sector has its own needs. Read how SDC adapts to yours on the industries page.`}
        />
        <div className="v2-grid v2-grid--3">
          {industries.slice(0, 3).map((i) => (
            <IndustryCard key={i.slug} industry={i} />
          ))}
        </div>
        <p className="v2-fineprint">
          <Link className="v2-text-link" href={`${BASE}/industries`}>
            All industries
          </Link>
        </p>
      </Section>

      <CtaBand
        title={
          <>
            Join them. <Accent>Start with a survey.</Accent>
          </>
        }
      />
    </>
  );
}
