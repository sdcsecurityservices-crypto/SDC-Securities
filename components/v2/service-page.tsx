import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BASE, SURVEY_URL, industryBySlug, serviceBySlug, type ServiceSlug } from "./data";
import {
  Accent,
  ButtonLink,
  CheckList,
  CtaBand,
  Eyebrow,
  PageHero,
  Photo,
  RelatedServices,
  Section,
  SectionHead,
  StepFlow,
  industryIcons,
} from "./ui";

export function serviceMetadata(slug: ServiceSlug) {
  const s = serviceBySlug(slug);
  return {
    title: s.name,
    description: `${s.summary} ${s.name} from SDC Security & Facility Services, Bengaluru: what is included, how we deliver it and the sites it suits.`,
  };
}

export function ServicePage({ slug }: { slug: ServiceSlug }) {
  const s = serviceBySlug(slug);
  return (
    <>
      <PageHero
        crumbs={[{ label: "Services", href: `${BASE}/services` }, { label: s.name }]}
        eyebrow={s.name}
        title={
          <>
            {s.headline[0]} <Accent>{s.headline[1]}</Accent>
          </>
        }
        lead={s.summary}
        actions={
          <>
            <ButtonLink href={SURVEY_URL}>Discuss this service</ButtonLink>
            <ButtonLink href="#included" variant="ghost">
              What is included
            </ButtonLink>
          </>
        }
        aside={
          <div className="v2-hero-facts">
            <h2>At a glance</h2>
            <CheckList items={s.highlights} tone="dark" />
          </div>
        }
      />

      <Section tone="white" labelledBy="svc-intro">
        <div className="v2-split">
          <div>
            <Eyebrow>Overview</Eyebrow>
            <h2 className="v2-h2" id="svc-intro">
              {s.name}, <Accent>done properly.</Accent>
            </h2>
            {s.intro.map((p) => (
              <p className="v2-lead" key={p.slice(0, 20)}>
                {p}
              </p>
            ))}
          </div>
          <Photo {...s.photo} className="v2-photo--wide" />
        </div>
      </Section>

      <Section tone="light" id="included" labelledBy="svc-included">
        <div className="v2-includes">
          <div>
            <Eyebrow>What is included</Eyebrow>
            <h2 className="v2-h2" id="svc-included">
              The full scope, <Accent>in writing.</Accent>
            </h2>
            <p className="v2-lead">
              Pick what your site needs. Everything you choose goes into a written scope, agreed with you before the
              first shift.
            </p>
          </div>
          <div className="v2-includes-panel">
            <p className="v2-tag">{s.name}</p>
            <CheckList items={s.includes} columns={s.includes.length > 5 ? 2 : 1} />
          </div>
        </div>
      </Section>

      <Section tone="white" labelledBy="svc-delivery">
        <SectionHead
          id="svc-delivery"
          eyebrow="How SDC delivers it"
          title={
            <>
              Five steps, <Accent>one accountable partner.</Accent>
            </>
          }
          lead="The same disciplined routine on every site: survey, plan, people, supervision and review."
        />
        <StepFlow steps={s.delivery} label={`How SDC delivers ${s.name.toLowerCase()}`} />
      </Section>

      <Section tone="navy" labelledBy="svc-sectors" rings="right">
        <SectionHead
          id="svc-sectors"
          eyebrow="Where it fits"
          title={
            <>
              Sectors this <Accent>service suits.</Accent>
            </>
          }
          lead="Each sector has its own needs. See how we adapt the service to yours."
        />
        <ul className="v2-sector-links">
          {s.sectors.map((slug) => {
            const ind = industryBySlug(slug);
            const Icon = industryIcons[ind.icon];
            return (
              <li key={slug}>
                <Link href={`${BASE}/industries#${slug}`}>
                  <Icon size={24} aria-hidden="true" />
                  <strong>{ind.name}</strong>
                  <span>{ind.line}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section tone="light" labelledBy="v2-related-title">
        <RelatedServices slugs={s.related} />
        <p className="v2-fineprint">
          <Link href={`${BASE}/services`} className="v2-text-link">
            See all services <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </Section>

      <CtaBand
        title={
          <>
            Let’s plan your <Accent>{s.short.toLowerCase()}</Accent> together.
          </>
        }
      />
    </>
  );
}
