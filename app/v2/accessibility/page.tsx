import type { Metadata } from "next";
import { company } from "@/components/v2/data";
import { LegalBody, LegalHero, Sec } from "@/components/v2/legal";
import { Accent } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Accessibility statement",
  description:
    "SDC’s commitment to an accessible website: our WCAG 2.1 AA aim, what we have done, known limitations, and how to report a problem.",
};

const toc = [
  { id: "aim", label: "Our aim" },
  { id: "measures", label: "What we have done" },
  { id: "limitations", label: "Known limitations" },
  { id: "feedback", label: "Report a problem" },
  { id: "review", label: "How we check" },
];

const mail = `mailto:${company.email}?subject=${encodeURIComponent("Accessibility problem on the SDC website")}`;

export default function AccessibilityPage() {
  return (
    <>
      <LegalHero
        crumb="Accessibility"
        eyebrow="Accessibility statement"
        title={
          <>
            A website everyone <Accent>can use.</Accent>
          </>
        }
        lead="Many of the people who apply to SDC use a basic phone, read Kannada or Hindi first, or use assistive technology. We build for them."
      />
      <LegalBody toc={toc}>
        <Sec id="aim" title="1. Our aim">
          <p>
            We aim to meet the <strong>Web Content Accessibility Guidelines (WCAG) 2.1, level AA</strong> across our
            public websites. We have not yet had an independent audit, so we do not claim full conformance. We describe
            what we have done and what we know still needs work.
          </p>
        </Sec>

        <Sec id="measures" title="2. What we have done">
          <ul>
            <li>
              <strong>Keyboard:</strong> every link, menu, button and form field can be reached and used with a keyboard,
              with a visible focus outline. A “Skip to content” link is the first thing on each page.
            </li>
            <li>
              <strong>Reduced motion:</strong> if your device is set to reduce motion, we turn off animations, slideshows
              and scrolling effects.
            </li>
            <li>
              <strong>Contrast:</strong> text and controls are designed to meet AA contrast ratios on light and dark
              backgrounds.
            </li>
            <li>
              <strong>Images:</strong> meaningful images have text alternatives; decorative images are hidden from screen
              readers.
            </li>
            <li>
              <strong>Structure:</strong> one main heading per page, headings in order, landmarks, breadcrumbs, and
              labelled form fields with clear error messages.
            </li>
            <li>
              <strong>Languages:</strong> the careers pages and job application form are available in English, Kannada and
              Hindi, and the page language is set so screen readers pronounce it correctly.
            </li>
            <li>
              <strong>Phones:</strong> pages work on small screens without sideways scrolling, and touch targets are large.
            </li>
            <li>
              <strong>Other ways to reach us:</strong> you can always call or WhatsApp {company.phoneDisplay} instead of
              using a form, including to apply for a job.
            </li>
          </ul>
        </Sec>

        <Sec id="limitations" title="3. Known limitations">
          <ul>
            <li>Most of the main website is in English only. Kannada and Hindi are available for careers pages.</li>
            <li>Our Kannada and Hindi translations have not all been reviewed by a native speaker yet.</li>
            <li>The silent background video on the Training page has no captions or audio description. It has no speech, and the same information is in the page text. It does not autoplay when reduced motion is on.</li>
            <li>Scanned documents, such as the ISO certificate image, are not fully readable by screen readers. The key details are also given in text.</li>
            <li>The SDC Command portal and demo are complex applications and have not been tested to the same level as the public pages.</li>
          </ul>
        </Sec>

        <Sec id="feedback" title="4. Report a problem">
          <p>
            If something on our website is hard to use, tell us. Say which page, what you were trying to do, and what
            device or assistive technology you use. We will reply within 5 working days and, where we can, give you the
            information another way in the meantime.
          </p>
          <ul>
            <li>
              Email <a href={mail}>{company.email}</a>
            </li>
            <li>Call or WhatsApp {company.phoneDisplay}</li>
          </ul>
        </Sec>

        <Sec id="review" title="5. How we check">
          <p>
            We test pages with a keyboard, at phone and desktop sizes, with reduced motion switched on, and with automated
            checks. We review this statement when the website changes significantly.
          </p>
        </Sec>
      </LegalBody>
    </>
  );
}
