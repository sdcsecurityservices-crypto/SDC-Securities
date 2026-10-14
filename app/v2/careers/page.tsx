import type { Metadata } from "next";
import {
  Award,
  GraduationCap,
  HandHeart,
  Medal,
  Shield,
  ShieldCheck,
  Shirt,
  SprayCan,
  TrendingUp,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { company, perks, whatsappLink } from "@/components/v2/data";
import {
  Accent,
  ButtonLink,
  Eyebrow,
  PageHero,
  Photo,
  Section,
  SectionHead,
  StepFlow,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join SDC Security & Facility Services in Bengaluru: security guards, lady guards, supervisors, housekeeping and facility staff. EPF and ESI, training at our academy and clear career progression. Ex-servicemen especially welcome.",
};

const perkIcons = [Shield, GraduationCap, Shirt, TrendingUp, Award, Users, Medal];

const roles = [
  { icon: ShieldCheck, title: "Security guards", text: "Access control, patrols and visitor management at corporate, healthcare, industrial and residential sites." },
  { icon: UserRound, title: "Lady guards", text: "Women’s posts in wards, maternity, OPD, ladies’ hostels and libraries, on day and night shifts." },
  { icon: UserCog, title: "Security supervisors", text: "Lead shift teams, run site checks and keep clients informed." },
  { icon: SprayCan, title: "Housekeeping & facility staff", text: "Keep workplaces clean, safe and ready, with on-site supervision." },
  { icon: Medal, title: "Ex-servicemen", text: "Bring your discipline and experience to a veteran-led organisation. Especially welcome." },
];

const applySteps = [
  { title: "Get in touch", text: `WhatsApp or call ${company.phoneDisplay}, or email ${company.email}, with your name, the role and where you live.` },
  { title: "Selection", text: "Background verification, a physical fitness assessment, an aptitude test and a personal interview." },
  { title: "Training", text: "Induction at our Bengaluru academy, with uniform and a site induction before your first shift." },
  { title: "On post", text: "Start work with EPF and ESI from day one, and keep growing through refreshers and leadership training." },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Company" }, { label: "Careers" }]}
        eyebrow="Careers at SDC"
        title={
          <>
            Serve with pride. <Accent>Grow with purpose.</Accent>
          </>
        }
        lead="Our people are our greatest strength. Whether you are experienced or just starting out, SDC offers careers in security, facility management, housekeeping and manpower, with training and a clear path to grow."
        image={{
          src: "/images/team/morning-salute.jpg",
          alt: "SDC guards, supervisors and lady guards saluting together at a morning parade",
          width: 1600,
          height: 398,
        }}
        actions={
          <>
            <ButtonLink href={whatsappLink("Hello SDC, I would like to apply for a job. My name is ")} icon="whatsapp">
              Apply on WhatsApp
            </ButtonLink>
            <ButtonLink href={`tel:${company.phone}`} variant="ghost" icon="phone">
              Call {company.phoneDisplay}
            </ButtonLink>
          </>
        }
      />

      <Section tone="white" labelledBy="ca-why">
        <div className="v2-split">
          <div>
            <Eyebrow>Why join SDC</Eyebrow>
            <h2 className="v2-h2" id="ca-why">
              A veteran-led team <Accent>that looks after its people.</Accent>
            </h2>
            <p className="v2-lead">
              SDC was founded and is led by ex-servicemen. That means clear responsibility, respect for every
              rank, training that never stops and leaders who are on the ground at morning assembly.
            </p>
            <p className="v2-lead">
              More than 1000 people work with SDC across Karnataka, at hospitals, colleges, offices, plants and apartment
              communities. Every one of them has EPF and ESI cover.
            </p>
          </div>
          <Photo
            src="/images/team/guards-and-lady-guards.jpg"
            alt="SDC guards in caps and lady guards in navy vests standing in line with ID cards"
            caption="Guards and lady guards"
            width={1600}
            height={1174}
            className="v2-photo--wide"
          />
        </div>
      </Section>

      <Section tone="light" labelledBy="ca-perks">
        <SectionHead
          id="ca-perks"
          eyebrow="What you get"
          title={
            <>
              More than <Accent>a job on a gate.</Accent>
            </>
          }
        />
        <ul className="v2-perks">
          {perks.map((p, i) => {
            const Icon = perkIcons[i] ?? HandHeart;
            return (
              <li key={p} className="v2-perk">
                <Icon size={26} aria-hidden="true" />
                <strong>{p}</strong>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section tone="white" labelledBy="ca-roles">
        <SectionHead
          id="ca-roles"
          eyebrow="Open roles"
          title={
            <>
              Find your place <Accent>on the team.</Accent>
            </>
          }
          lead="We are always looking for disciplined, dependable people to protect the places our clients care about. Ex-servicemen are especially welcome."
        />
        <ul className="v2-roles">
          {roles.map((r) => (
            <li key={r.title} className="v2-card v2-role">
              <span className="v2-icon-bubble" aria-hidden="true">
                <r.icon size={22} strokeWidth={1.7} />
              </span>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <ButtonLink
                href={whatsappLink(`Hello SDC, I would like to apply for the ${r.title.toLowerCase()} role. My name is `)}
                variant="outline"
                icon="whatsapp"
              >
                Apply for this role
              </ButtonLink>
            </li>
          ))}
          <li className="v2-card v2-card--gold">
            <h3>Not sure which role fits?</h3>
            <p>Send us your name and experience. We will tell you where you fit best.</p>
            <ButtonLink href={`mailto:${company.email}?subject=${encodeURIComponent("Job application")}`} variant="navy">
              Email {company.email}
            </ButtonLink>
          </li>
        </ul>
      </Section>

      <Section tone="navy" labelledBy="ca-apply" rings="right">
        <SectionHead
          id="ca-apply"
          eyebrow="How to apply"
          title={
            <>
              Four steps <Accent>to your first shift.</Accent>
            </>
          }
          lead="Applying is simple. Message, call or email us, and we will take it from there."
        />
        <StepFlow steps={applySteps} label="How to apply" tone="dark" />
        <div className="v2-actions">
          <ButtonLink href={whatsappLink("Hello SDC, I would like to apply for a job. My name is ")} icon="whatsapp">
            WhatsApp {company.phoneDisplay}
          </ButtonLink>
          <ButtonLink href={`tel:${company.phone}`} variant="ghost" icon="phone">
            Call us
          </ButtonLink>
          <ButtonLink href={`mailto:${company.email}?subject=${encodeURIComponent("Job application")}`} variant="ghost" icon="none">
            Email {company.email}
          </ButtonLink>
        </div>
      </Section>

      <Section tone="white" labelledBy="ca-people">
        <SectionHead
          id="ca-people"
          eyebrow="Our people"
          title={
            <>
              One team, <Accent>every morning.</Accent>
            </>
          }
          lead="Guards, lady guards and supervisors at morning assembly and salute, with SDC’s leadership on the ground to brief them before every shift."
        />
        <div className="v2-gallery">
          <Photo className="v2-photo--big" src="/images/team/assembly-leadership.jpg" alt="SDC guards, lady guards and supervisors lined up at morning assembly with the company's leadership in front" caption="Morning assembly" width={1600} height={1066} />
          <Photo src="/images/team/leadership-briefing.jpg" alt="SDC leadership briefing a formation of uniformed guards" caption="Leadership briefing" width={1600} height={1066} />
          <Photo src="/images/team/lady-guards-parade.jpg" alt="SDC lady guards in formation alongside supervisors in khaki" caption="Lady guards" width={1600} height={1066} />
          <Photo className="v2-photo--span2" src="/images/team/guard-line.jpg" alt="A long line of SDC guards in uniform standing at attention" caption="On parade" width={1600} height={1066} />
        </div>
      </Section>
    </>
  );
}
