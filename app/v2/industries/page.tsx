import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BASE, SURVEY_URL, industries, serviceBySlug } from "@/components/v2/data";
import {
  Accent,
  ButtonLink,
  CtaBand,
  Eyebrow,
  PageHero,
  Photo,
  Section,
  industryIcons,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Industries we serve",
  description:
    "Security, housekeeping, facility and manpower services for healthcare, education, corporate and technology, industrial and logistics sites and residential communities across Karnataka.",
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Industries" }]}
        eyebrow="Where we work"
        title={
          <>
            Different environments. <Accent>One standard.</Accent>
          </>
        }
        lead="A hospital ward, a college hostel, a tech campus, a warehouse gate and an apartment lobby each need something different. Here is what each needs, and how SDC serves it."
        actions={
          <nav className="v2-jump" aria-label="Jump to an industry">
            {industries.map((i) => {
              const Icon = industryIcons[i.icon];
              return (
                <a key={i.slug} href={`#${i.slug}`}>
                  <Icon size={16} aria-hidden="true" />
                  {i.name}
                </a>
              );
            })}
            <a href="#womens-safety">Women’s safety</a>
          </nav>
        }
      />

      {industries.map((ind, idx) => {
        const Icon = industryIcons[ind.icon];
        const tone = idx % 2 === 0 ? "white" : "light";
        return (
          <div key={ind.slug}>
            <Section tone={tone} id={ind.slug} className="v2-industry" labelledBy={`ind-${ind.slug}`}>
              <div className="v2-split v2-split--top">
                <div>
                  <div className="v2-industry-head">
                    <span className="v2-icon-bubble" aria-hidden="true">
                      <Icon size={22} strokeWidth={1.7} />
                    </span>
                    <Eyebrow>{`${String(idx + 1).padStart(2, "0")} · ${ind.name}`}</Eyebrow>
                  </div>
                  <h2 className="v2-h2" id={`ind-${ind.slug}`}>
                    {ind.line.split(" ").slice(0, -2).join(" ")}{" "}
                    <Accent>{ind.line.split(" ").slice(-2).join(" ")}</Accent>
                  </h2>
                  <p className="v2-lead">{ind.text}</p>
                  <div className="v2-pill-links" aria-label="Relevant services">
                    {ind.services.map((slug) => (
                      <Link key={slug} href={`${BASE}/services/${slug}`}>
                        {serviceBySlug(slug).name}
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="v2-industry-cols">
                  <div>
                    <h3>What the site needs</h3>
                    <ul className="v2-needs">
                      {ind.needs.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="v2-includes-panel">
                    <h3>How SDC serves it</h3>
                    <ul className="v2-needs">
                      {ind.serve.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Section>
            {ind.slug === "education" && <WomensSafety />}
          </div>
        );
      })}

      <CtaBand
        title={
          <>
            Your site next. <Accent>Let’s walk it together.</Accent>
          </>
        }
        text="Every deployment starts with a free site survey and a written post plan, whatever the sector."
      />
    </>
  );
}

function WomensSafety() {
  return (
    <Section tone="navy" id="womens-safety" labelledBy="ind-women" rings="right">
      <div className="v2-women">
        <div>
          <Eyebrow>Women’s safety</Eyebrow>
          <h2 className="v2-h2" id="ind-women">
            Women’s spaces, <Accent>guarded by women.</Accent>
          </h2>
          <p className="v2-lead">
            Wards, maternity, OPD, ladies’ hostels and libraries need trained women officers on every shift. SDC staffs
            them with trained lady guards as a matter of course.
          </p>
          <p className="v2-lead">
            It is built into how we plan. When a post is marked as a women’s post, SDC’s deployment planner will not
            roster anyone else on it.
          </p>
          <ul className="v2-chips v2-chips--dark" aria-label="Typical women’s posts">
            {["Wards", "Maternity", "OPD", "Ladies’ hostels", "Libraries"].map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="v2-actions">
            <ButtonLink href={SURVEY_URL}>Plan women’s posts for your site</ButtonLink>
          </div>
        </div>
        <Photo
          src="/images/v2/lady-guards-training.jpg"
          alt="SDC lady guards in uniform at a classroom training session"
          caption="Trained. Verified. On every shift."
          width={820}
          height={760}
        />
      </div>
    </Section>
  );
}
