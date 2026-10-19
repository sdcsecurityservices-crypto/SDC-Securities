// Content for the multi-page website (/v2). Copy is drawn from the current
// one-page site, the proofread old-site content (docs/old-site-content.md),
// the pitch deck and the brochure. Keep facts here so pages stay consistent.
import { company, whatsappLink } from "@/lib/company";

export { company, whatsappLink };

export const BASE = "/v2";
export const PORTAL_URL = "/command";
export const CAREERS_APPLY_URL = "/careers/apply";
export const CAREERS_KN_URL = "/careers?lang=kn";
export const DEMO_URL = "/command";
export const SURVEY_URL = `${BASE}/contact#survey`;

export const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(
    "No. 102, Kempamma Layout, near St. Philomena's School, Mariyappana Palya, Bengaluru 560056, Karnataka",
  );

export const addressLines = [
  "No. 102, Ground Floor, Kempamma Layout,",
  "near St. Philomena’s School, Mariyappana Palya,",
  "Bengaluru 560 056, Karnataka",
];

export const facts = [
  { value: "1000+", label: "People deployed", note: "Guards, lady guards and facility teams" },
  { value: "50+", label: "Organisations served", note: "Across Karnataka" },
  { value: "2019", label: "PSARA licensed", note: company.psara },
  { value: "2024", label: "ISO 9001:2015 registered", note: "Cert. QMS24221266" },
];

export const iso = {
  standard: "ISO 9001:2015",
  number: "QMS24221266",
  body: "UKGC Assessment",
  validTo: "23 Dec 2027",
  registered: "Dec 2024",
  scope: "Security, housekeeping and manpower supply",
};

export type ServiceSlug =
  | "security"
  | "facility-management"
  | "housekeeping"
  | "manpower"
  | "payroll-compliance";

export type IndustrySlug = "healthcare" | "education" | "corporate" | "industrial" | "residential";

export type Service = {
  slug: ServiceSlug;
  name: string;
  short: string;
  headline: [string, string];
  summary: string;
  intro: string[];
  includes: string[];
  highlights: string[];
  delivery: { title: string; text: string }[];
  sectors: IndustrySlug[];
  photo: PhotoKey;
  related: ServiceSlug[];
  icon: "shield" | "building" | "sparkles" | "users" | "clipboard";
  forWho: string;
  faq: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "security",
    name: "Security services",
    short: "Security",
    icon: "shield",
    headline: ["Security,", "without blind spots."],
    summary:
      "Disciplined guarding, risk assessment and rapid response, led by veterans who understand what is at stake.",
    intro: [
      "Security is where SDC began. Our guards and lady guards protect hospitals, colleges, offices, plants, construction sites and apartment communities across Karnataka.",
      "Every deployment starts with a survey of your site and a written post plan. Each post has clear orders, a trained person on it and a supervisor who answers for it.",
    ],
    includes: [
      "Armed and unarmed security guards",
      "Residential and apartment security",
      "Corporate and commercial security",
      "Industrial and warehouse security",
      "Event security",
      "CCTV monitoring and surveillance",
      "Construction site security",
      "Hotel and shopping mall security",
    ],
    highlights: [
      "Manned guarding and access control",
      "Risk assessment and crisis management",
      "Patrols, visitor management and incident reporting",
    ],
    delivery: [
      { title: "Survey the site", text: "A risk assessment of gates, blocks, parking and night routes." },
      { title: "Write the post orders", text: "Posts, shifts, headcount and duties, agreed with you in writing." },
      { title: "Put trained people on post", text: "Verified guards with a site induction before the first shift. Women’s posts go to lady guards." },
      { title: "Supervise every shift", text: "Selfie and GPS check-in, patrol and incident reports, and a supervisor who visits." },
      { title: "Review every month", text: "Coverage, incidents and improvements, reviewed with you." },
    ],
    sectors: ["healthcare", "education", "corporate", "industrial", "residential"],
    photo: "fireDemoLine",
    related: ["manpower", "facility-management", "payroll-compliance"],
    forWho: "Hospitals, colleges, offices, plants, warehouses, construction sites and apartment communities that need trained guards on post, day and night.",
    faq: [
          {
                "q": "How do we get started?",
                "a": "Book a free site survey. We walk your site, assess the gates, blocks, parking and night routes, and give you a written post plan with posts, shifts and headcount."
          },
          {
                "q": "Are your guards trained before they start?",
                "a": "Yes. Every guard completes PSARA basic training and a site induction on your layout, codes and contacts before the first shift, with refreshers every 6 to 12 months."
          },
          {
                "q": "Can we have lady guards on women’s posts?",
                "a": "Yes. Women’s posts such as wards, maternity, OPD, ladies’ hostels and libraries are staffed by trained lady guards, and our deployment planner will not roster anyone else on them."
          },
          {
                "q": "How do we know the guard is actually on post?",
                "a": "Guards check in with a selfie and GPS on the SDC guard app at the start of every shift, and patrol and incident reports are filed from the post. You can see coverage in the client portal."
          },
          {
                "q": "Is SDC licensed?",
                "a": "Yes. SDC holds PSARA licence ISD/PSA-64/2019 and is ISO 9001:2015 certified (certificate QMS24221266) for security, housekeeping and manpower supply."
          },
          {
                "q": "Who pays PF and ESI for the guards?",
                "a": "SDC does. EPF and ESI are paid for every employee we deploy, so the statutory risk is not passed on to you."
          }
    ],
  },
  {
    slug: "facility-management",
    name: "Facility management",
    short: "Facility",
    icon: "building",
    headline: ["Spaces that", "work better."],
    summary:
      "End-to-end facility services that keep buildings safe, efficient and well maintained.",
    intro: [
      "A building runs well when the small things are done on time, every day. SDC’s facility teams look after the upkeep so your own people can focus on their work.",
      "Site supervision and quality checks are part of the service, and you deal with one accountable partner instead of several vendors.",
    ],
    includes: [
      "Building maintenance and repairs",
      "Electrical and plumbing services",
      "Fire safety and risk management",
      "Pest control and waste management",
      "Landscaping and garden maintenance",
    ],
    highlights: [
      "Housekeeping and facility upkeep",
      "Site supervision and quality checks",
      "Coordinated service delivery",
    ],
    delivery: [
      { title: "Walk the building", text: "We understand the site, its routines and what is not working today." },
      { title: "Agree the scope", text: "Tasks, frequencies and staffing, written down and agreed with you." },
      { title: "Staff and supervise", text: "Trained facility staff, led by a supervisor on site." },
      { title: "Check the quality", text: "Scheduled inspections and real-time reporting." },
      { title: "Review together", text: "A regular review of what was done and what needs attention." },
    ],
    sectors: ["healthcare", "education", "corporate", "industrial", "residential"],
    photo: "extinguisherBriefing",
    related: ["housekeeping", "security", "manpower"],
    forWho: "Buildings that need upkeep done on time without managing several vendors: offices, campuses, hospitals, plants and residential communities.",
    faq: [
          {
                "q": "How do we get started?",
                "a": "Book a free site survey. We walk your site, assess the gates, blocks, parking and night routes, and give you a written post plan with posts, shifts and headcount."
          },
          {
                "q": "What does facility management cover?",
                "a": "Building maintenance and repairs, electrical and plumbing services, fire safety and risk management, pest control and waste management, and landscaping and garden maintenance."
          },
          {
                "q": "Can facility management be combined with security and housekeeping?",
                "a": "Yes. Many clients combine services under one contract, with one supervisor and one set of records for the site."
          },
          {
                "q": "How is the work checked?",
                "a": "A supervisor runs scheduled inspections against the agreed scope, and issues are reported and followed up."
          },
          {
                "q": "Who employs the facility staff?",
                "a": "SDC does, with EPF and ESI paid for every employee we deploy."
          }
    ],
  },
  {
    slug: "housekeeping",
    name: "Housekeeping",
    short: "Housekeeping",
    icon: "sparkles",
    headline: ["Clean, hygienic,", "cared for."],
    summary:
      "Where spotless cleaning meets peace of mind. Systematic methods and eco-friendly products.",
    intro: [
      "Clean, organised and hygienic spaces for offices, commercial buildings, hospitals, residential complexes and industrial sites.",
      "SDC’s housekeeping teams work to systematic methods with eco-friendly products, and a supervisor checks the work, shift after shift.",
    ],
    includes: [
      "Corporate and office cleaning",
      "Industrial and warehouse cleaning",
      "Hospital and healthcare cleaning",
      "Residential and apartment cleaning",
      "Carpet and upholstery cleaning",
      "Deep cleaning and sanitisation",
      "Restroom maintenance",
      "Waste disposal and recycling",
    ],
    highlights: [
      "Systematic cleaning methods",
      "Eco-friendly products",
      "Supervised, shift after shift",
    ],
    delivery: [
      { title: "Map the areas", text: "Floors, blocks, washrooms and high-traffic zones, with what each needs." },
      { title: "Set the schedule", text: "Daily, weekly and deep-cleaning routines, agreed with you." },
      { title: "Deploy the team", text: "Trained housekeeping staff with uniform and site induction." },
      { title: "Inspect the work", text: "Supervisor checks against the schedule, with issues fixed the same shift." },
      { title: "Review and improve", text: "A regular review of standards and feedback from your team." },
    ],
    sectors: ["healthcare", "education", "corporate", "residential", "industrial"],
    photo: "academyBatch",
    related: ["facility-management", "manpower", "security"],
    forWho: "Offices, hospitals, campuses, warehouses and apartment communities that want clean, hygienic spaces with supervision on every shift.",
    faq: [
          {
                "q": "How do we get started?",
                "a": "Book a free site survey. We walk your site, assess the gates, blocks, parking and night routes, and give you a written post plan with posts, shifts and headcount."
          },
          {
                "q": "Which areas do you clean?",
                "a": "Offices, industrial and warehouse floors, hospital and healthcare areas, residential and apartment common areas, carpets and upholstery, restrooms, and deep cleaning and sanitisation."
          },
          {
                "q": "What products do you use?",
                "a": "Our teams work to systematic methods using eco-friendly products."
          },
          {
                "q": "How is quality checked?",
                "a": "A supervisor checks the work against the agreed schedule, and issues are fixed in the same shift where possible."
          },
          {
                "q": "Can housekeeping be combined with security?",
                "a": "Yes. One partner, one supervisor and one set of records for the site."
          }
    ],
  },
  {
    slug: "manpower",
    name: "Manpower supply",
    short: "Manpower",
    icon: "users",
    headline: ["The right people.", "Ready."],
    summary:
      "A business is only as strong as its workforce. Skilled, semi-skilled and unskilled staff, recruited, trained and supervised by SDC.",
    intro: [
      "Skilled and support staff, carefully sourced and supervised, for long-term or short-term needs.",
      "SDC is one accountable partner from recruitment to relieving: we select, verify, train, deploy and look after every person we place.",
    ],
    includes: [
      "Security and facility staff",
      "Housekeeping and janitorial staff",
      "Industrial and factory workforce",
      "Front office and reception staff",
      "Loading and unloading workers",
      "Drivers and logistics support",
      "Hospitality and catering staff",
    ],
    highlights: [
      "Skilled and support staffing",
      "Onboarding and deployment",
      "Training and employee welfare",
    ],
    delivery: [
      { title: "Understand the role", text: "Skills, shifts, headcount and the standard you expect." },
      { title: "Select with care", text: "Background verification, fitness, aptitude and a personal interview." },
      { title: "Train and induct", text: "Role training and a site induction before day one." },
      { title: "Deploy and supervise", text: "Attendance recorded every shift, with a supervisor accountable." },
      { title: "Look after people", text: "EPF, ESI, payslips and welfare, handled by SDC." },
    ],
    sectors: ["industrial", "corporate", "healthcare", "residential", "education"],
    photo: "lineup",
    related: ["security", "housekeeping", "payroll-compliance"],
    forWho: "Organisations that need skilled, semi-skilled or unskilled staff for long-term or short-term needs, without taking on the hiring and payroll themselves.",
    faq: [
          {
                "q": "How do we get started?",
                "a": "Book a free site survey. We walk your site, assess the gates, blocks, parking and night routes, and give you a written post plan with posts, shifts and headcount."
          },
          {
                "q": "What roles can you supply?",
                "a": "Security and facility staff, housekeeping and janitorial staff, industrial and factory workforce, front office and reception staff, loading and unloading workers, drivers and logistics support, and hospitality and catering staff."
          },
          {
                "q": "How are people selected?",
                "a": "Every candidate goes through background verification, a physical fitness assessment, an aptitude test and a personal interview."
          },
          {
                "q": "Who handles PF, ESI and payslips?",
                "a": "SDC does. EPF and ESI are paid for every employee, and wages run on approved attendance with a payslip for every person."
          },
          {
                "q": "Is there one point of contact?",
                "a": "Yes. SDC is one accountable partner from recruitment to relieving."
          }
    ],
  },
  {
    slug: "payroll-compliance",
    name: "Payroll & compliance",
    short: "Payroll & compliance",
    icon: "clipboard",
    headline: ["Less admin.", "More clarity."],
    summary:
      "Bring attendance, payroll and employee administration together, with clear records at every step.",
    intro: [
      "When a contractor skips PF or ESI, the client carries the risk. SDC removes that risk: statutory contributions are paid for every employee on your site, and the records are there when you need them.",
      "Wages run only on approved attendance, and invoices are built from the same records, so you pay for the posts that were actually covered.",
    ],
    includes: [
      "Attendance and leave administration",
      "Payroll and settlement support",
      "Statutory reporting and audit support",
      "EPF and ESI contributions for every employee",
      "Payslips for every guard and staff member",
      "Invoices built from approved attendance",
      "Background verification status on every file",
      "ID and bank details encrypted, every change logged",
    ],
    highlights: [
      "Attendance and leave administration",
      "Payroll and settlement support",
      "Statutory reporting and audit support",
    ],
    delivery: [
      { title: "Record attendance", text: "Selfie and GPS check-in on the guard app, every shift." },
      { title: "Approve it", text: "Attendance is checked and approved before anything is paid." },
      { title: "Run payroll", text: "Wages from approved attendance, with a payslip for every person." },
      { title: "Pay statutory dues", text: "EPF and ESI contributions for every employee on your site." },
      { title: "Invoice and report", text: "Invoices and service reports from the same approved records." },
    ],
    sectors: ["corporate", "industrial", "healthcare", "education", "residential"],
    photo: "fireBriefing",
    related: ["manpower", "security", "facility-management"],
    forWho: "Facility heads, procurement teams and finance teams who want statutory compliance and billing they can check, not take on trust.",
    faq: [
          {
                "q": "How do we get started?",
                "a": "Book a free site survey. We walk your site, assess the gates, blocks, parking and night routes, and give you a written post plan with posts, shifts and headcount."
          },
          {
                "q": "Do you pay EPF and ESI for every employee?",
                "a": "Yes. Statutory contributions are paid for every employee SDC deploys on your site."
          },
          {
                "q": "How is attendance recorded?",
                "a": "Guards check in with a selfie and GPS on the SDC guard app. Attendance is approved before anything is paid or billed."
          },
          {
                "q": "How are invoices calculated?",
                "a": "Invoices are built from the same approved attendance, so you pay for the posts that were actually covered."
          },
          {
                "q": "Can we see the records?",
                "a": "Yes. Coverage, attendance, reports and invoices are available in the client portal, which shows your sites and nothing else."
          },
          {
                "q": "How is personal data protected?",
                "a": "ID and bank details are encrypted, and every change is logged with who made it and when."
          }
    ],
  },
];

export const serviceBySlug = (slug: ServiceSlug) => services.find((s) => s.slug === slug)!;

export type Industry = {
  slug: IndustrySlug;
  name: string;
  line: string;
  text: string;
  needs: string[];
  serve: string[];
  services: ServiceSlug[];
  icon: "heart" | "school" | "briefcase" | "factory" | "home";
};

export const industries: Industry[] = [
  {
    slug: "healthcare",
    name: "Healthcare",
    icon: "heart",
    line: "Care without interruption.",
    text: "Sensitive access control, emergency readiness and dependable staffing for hospitals, medical colleges and care facilities.",
    needs: [
      "Controlled access to wards, ICUs and maternity",
      "Calm handling of crowds and distressed families in emergency",
      "Women officers on wards, maternity and OPD, day and night",
      "Clean, hygienic spaces with careful waste handling",
    ],
    serve: [
      "Guards trained for hospital work: patient dignity, de-escalation and Code Pink drills for infant safety",
      "Infection control and biomedical waste segregation in the training path",
      "Trained lady guards on every women’s post",
      "Hospital and healthcare housekeeping, supervised every shift",
    ],
    services: ["security", "housekeeping", "facility-management"],
  },
  {
    slug: "education",
    name: "Education",
    icon: "school",
    line: "Safer places to learn.",
    text: "Campus patrols, visitor management and trained teams that protect students, staff and learning spaces.",
    needs: [
      "A clear record of who enters the campus",
      "Patrols across blocks, hostels and grounds",
      "Lady guards for ladies’ hostels and libraries",
      "Clean classrooms, washrooms and common areas",
    ],
    serve: [
      "Visitor management and gate control at every entrance",
      "Scheduled patrols with digital patrol reports",
      "Trained lady guards on women’s posts, including hostels at night",
      "Campus housekeeping and facility upkeep under one supervisor",
    ],
    services: ["security", "housekeeping", "facility-management"],
  },
  {
    slug: "corporate",
    name: "Corporate & technology",
    icon: "briefcase",
    line: "A secure campus. An uninterrupted workday.",
    text: "Access control, visitor coordination and professional guarding that fit the rhythm of your workplace.",
    needs: [
      "Courteous, professional people at reception and gates",
      "Access control and visitor coordination",
      "Clean offices, washrooms and pantries",
      "Clear reports for the facility and admin team",
    ],
    serve: [
      "Corporate and commercial security with trained front-of-house manner",
      "Front office and reception staff through manpower supply",
      "Office cleaning and facility upkeep",
      "A client portal with coverage, incidents and reports for your sites",
    ],
    services: ["security", "housekeeping", "manpower"],
  },
  {
    slug: "industrial",
    name: "Industrial & logistics",
    icon: "factory",
    line: "Keep your operations moving.",
    text: "Perimeter protection, vehicle checks and loss prevention designed around busy industrial environments.",
    needs: [
      "Perimeter protection across large sites",
      "Vehicle and material checks at the gate",
      "Fire safety and emergency readiness",
      "Reliable workforce for loading, unloading and the shop floor",
    ],
    serve: [
      "Industrial and warehouse security with patrols and gate checks",
      "Guards practised in live fire and fire-hose drills",
      "Industrial, factory and loading workforce through manpower supply",
      "Industrial and warehouse cleaning",
    ],
    services: ["security", "manpower", "housekeeping"],
  },
  {
    slug: "residential",
    name: "Residential communities",
    icon: "home",
    line: "Peace of mind, closer to home.",
    text: "Welcoming gates, vigilant patrols and coordinated facility teams for the places people call home.",
    needs: [
      "A welcoming but firm gate for residents, visitors and deliveries",
      "Night patrols across towers, parking and common areas",
      "Clean, well-kept common areas and gardens",
      "One accountable partner for the association",
    ],
    serve: [
      "Residential and apartment security, day and night",
      "Patrols with digital records the association can see",
      "Apartment housekeeping, landscaping and garden maintenance",
      "Facility upkeep: electrical, plumbing and pest control",
    ],
    services: ["security", "housekeeping", "facility-management"],
  },
];

export const industryBySlug = (slug: IndustrySlug) => industries.find((i) => i.slug === slug)!;

export const values = [
  ["Integrity", "Honesty, transparency and ethical conduct in everything we do."],
  ["Reliability", "Consistent service our clients can count on, shift after shift."],
  ["Professionalism", "High standards of discipline, training and conduct on every post."],
  ["Client first", "Every deployment is planned around the client’s site and needs."],
  ["Safety", "Protecting people, property and premises comes before everything else."],
] as const;

export const vision =
  "To be India’s most trusted provider of security and facility services: safe, well-run spaces for businesses and individuals, delivered by reliable people and practical technology.";
export const mission =
  "To provide high-quality security and facility services through trained professionals, sound systems and a customer-first approach, and to build long-term relationships on trust, integrity and consistent service.";

export const onboarding = [
  { title: "Site survey", text: "Risk assessment of gates, blocks, parking and night routes." },
  { title: "Post plan", text: "Posts, shifts, headcount and written post orders, agreed with you." },
  { title: "People", text: "Selection, background checks and site induction." },
  { title: "Go live", text: "A supervisor on site through handover, roster published." },
  { title: "Review", text: "A monthly review of coverage, incidents and improvements." },
];

export const selection = [
  { title: "Background verification", text: "Identity, address and history checked, with the status kept on every employee’s file." },
  { title: "Physical fitness", text: "A fitness assessment, because the job means long shifts on your feet." },
  { title: "Aptitude test", text: "Reading a situation, following orders and reporting it clearly." },
  { title: "Personal interview", text: "We select for integrity, discipline and responsibility, and match each person to the post." },
];

export const trainingCycle = [
  { title: "Induction", text: "PSARA basic training in the classroom and the field: fire, first aid, conduct and SOS." },
  { title: "Your site", text: "A site induction on your layout, codes and contacts, before the first shift." },
  { title: "Your industry", text: "Specialist modules for hospital, campus, corporate, logistics and industrial sites." },
  { title: "Refreshers", text: "Every 6 to 12 months: mock drills, legal powers, reporting and courtesy." },
  { title: "Leadership", text: "Shift supervisors, control room operators and in-house trainers." },
];

export const perks = [
  "EPF and ESI coverage",
  "Training and skill development at our Bengaluru academy",
  "Uniform and site induction",
  "Clear career progression",
  "Recognition for outstanding performance",
  "A team culture built on trust and respect",
  "Veteran-led leadership",
];


/* ---------- photography ---------- */
// Hi-res SDC photos, converted from the original Canon RAW files and graded
// consistently. Each has 960, 1600 and 2400 px wide derivatives.
export type Photo = { src: string; w: number; h: number; alt: string; sizes?: number[]; ext?: string; illustrative?: boolean };
const hi = (name: string, alt: string): Photo => ({ src: `/images/v2/photos/${name}`, w: 2400, h: 1600, alt, sizes: [960, 1600, 2400] });
export const photos = {
  lineup: hi("lineup", "SDC lady guards in navy vests and guards in caps lined up on the steps outside an academy building"),
  academyBatch: hi("academy-batch", "A full SDC training batch of guards and lady guards in a lecture hall, with SDC’s leadership seated in front"),
  classroom: hi("classroom", "SDC lady guards in uniform listening during a classroom training session"),
  classroomWide: hi("classroom-wide", "Rows of SDC lady guards and guards taking notes in a lecture hall"),
  trainer: hi("trainer", "A trainer at the lectern addressing a hall of SDC guards and lady guards"),
  extinguisherBriefing: hi("extinguisher-briefing", "An instructor holding up a fire extinguisher in front of SDC guards and lady guards"),
  fireDrill: hi("fire-drill", "An SDC guard putting out a training fire with an extinguisher while the batch watches"),
  fireDrillTeam: hi("fire-drill-team", "SDC guards with extinguishers at a live fire drill, an instructor in a high-visibility vest beside them"),
  fireDemoLine: hi("fire-demo-line", "SDC lady guards and guards standing in formation as a guard tackles a training fire"),
  hoseDrill: hi("hose-drill", "SDC guards in helmets and high-visibility vests running out a fire hose"),
  hoseRaise: hi("hose-raise", "SDC guards in yellow helmets raising a fire hose during a drill as colleagues watch"),
  fireBriefing: hi("fire-briefing", "An instructor briefing a formation of SDC guards with a fire extinguisher before a drill"),
  campus: { src: "/images/security-campus", ext: "jpg", w: 1672, h: 941, alt: "A uniformed security guard on duty outside a glass office building at night (illustrative image)", illustrative: true },
} satisfies Record<string, Photo>;
export type PhotoKey = keyof typeof photos;

/* ---------- clients ---------- */
export type ClientFilter = "healthcare" | "education" | "infrastructure" | "industry" | "homes" | "retail";
export const clientFilters: { id: ClientFilter | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
  { id: "industry", label: "Industry & FMCG" },
  { id: "homes", label: "Homes & real estate" },
  { id: "retail", label: "Automotive & retail" },
];
export type Client = {
  name: string;
  logo: string | null;
  sector: string;
  filter: ClientFilter;
  shape: "wide" | "mid" | "square";
  marquee?: boolean;
  place?: string;
  span?: boolean;
};
export const clients: Client[] = [
  { name: "Namma Metro", place: "Bengaluru", logo: "/clients/namma-metro.svg", sector: "Metro rail", filter: "infrastructure", shape: "wide", marquee: true },
  { name: "Vedaanta Senior Living", logo: "/clients/vedaanta.svg", sector: "Senior living", filter: "homes", shape: "mid" },
  { name: "VBHC", logo: "/clients/vbhc.svg", sector: "Housing", filter: "homes", shape: "square" },
  { name: "Lamborghini Bangalore", place: "Bengaluru", logo: "/images/v2/lamborghini.svg", sector: "Automotive", filter: "retail", shape: "wide", marquee: true },
  { name: "Universal Textile Mills", span: true, logo: "/clients/utm.webp", sector: "Textiles", filter: "industry", shape: "wide" },
  { name: "R. L. Jalappa Hospital", place: "Kolar", logo: "/clients/rl-jalappa.svg", sector: "Healthcare", filter: "healthcare", shape: "square", marquee: true },
  { name: "Jindal Naturecare Limited", span: true, logo: "/clients/jindal-naturecare.png", sector: "Wellness", filter: "healthcare", shape: "mid" },
  { name: "Geltec", logo: "/clients/geltec.png", sector: "Manufacturing", filter: "industry", shape: "mid" },
  { name: "KPTCL", place: "Karnataka", logo: "/images/v2/kptcl-cropped.png", sector: "Power transmission", filter: "infrastructure", shape: "square", marquee: true },
  { name: "Asal Foods", logo: "/clients/asal.png", sector: "Food", filter: "industry", shape: "mid" },
  { name: "Saify Ind", logo: "/clients/saify.png", sector: "Manufacturing", filter: "industry", shape: "mid" },
  { name: "Sri Devaraj Urs Medical College", place: "Kolar", logo: "/clients/sdumc.webp", sector: "Medical education", filter: "healthcare", shape: "square", marquee: true },
  { name: "National Public School", place: "Sarjapur Road", logo: "/clients/nps.png", sector: "School", filter: "education", shape: "square" },
  { name: "Milky Mist", logo: "/clients/milky-mist.png", sector: "Dairy & FMCG", filter: "industry", shape: "wide", marquee: true },
  { name: "Indya Estates", logo: "/clients/indya-estates.png", sector: "Real estate", filter: "homes", shape: "mid" },
  { name: "RK Gardenia", logo: "/clients/rk-gardenia.png", sector: "Residential", filter: "homes", shape: "mid" },
  { name: "Subha Builders & Developers", span: true, logo: "/clients/subha.png", sector: "Real estate", filter: "homes", shape: "mid" },
  { name: "National Public School", place: "M.S. Palya", logo: "/clients/nps.png", sector: "School", filter: "education", shape: "square" },
  { name: "Power Hills Construction", logo: "/clients/power-hills.png", sector: "Construction", filter: "infrastructure", shape: "mid" },
  { name: "Ramalingam Construction", logo: "/clients/ramalingam.png", sector: "Construction", filter: "infrastructure", shape: "square" },
  { name: "Shrishaila Electricals", logo: "/images/v2/shrishaila.png", sector: "Electrical contracting", filter: "infrastructure", shape: "square" },
  { name: "Satellite Club", span: true, logo: null, sector: "Club", filter: "retail", shape: "mid" },
];

/* ---------- a day in the system (illustrative) ---------- */
export const dayInSystem = [
  { time: "18:00", title: "Shift starts", text: "The night guard checks in on the SDC guard app with a selfie. GPS confirms they are inside the site boundary.", tag: "Guard app" },
  { time: "18:01", title: "Post shows covered", text: "The command centre marks the post covered. Your client portal shows the same, live.", tag: "Command centre" },
  { time: "21:00", title: "Patrol rounds", text: "Rounds at the times in your post orders, each logged from the guard app as it happens.", tag: "Patrol log" },
  { time: "02:14", title: "Incident reported", text: "A broken gate latch: photo, time and place filed from the post, and the supervisor follows it up.", tag: "Incident" },
  { time: "06:00", title: "Handover", text: "The day guard checks in. The planner had already blocked anyone without enough rest.", tag: "Planner" },
  { time: "07:00", title: "Morning report", text: "Attendance is approved. The same record feeds payroll and your invoice.", tag: "Client portal" },
];

/* ---------- navigation ---------- */
export type NavItem = { label: string; href: string; note?: string };
export const nav: { label: string; href?: string; kind?: "mega" | "list"; children?: NavItem[] }[] = [
  {
    label: "Services",
    kind: "mega",
    children: [
      ...services.map((s) => ({ label: s.name, href: `${BASE}/services/${s.slug}`, note: s.headline.join(" ") })),
      { label: "All services", href: `${BASE}/services`, note: "Combine services under one contract" },
    ],
  },
  {
    label: "Industries",
    kind: "list",
    children: [
      ...industries.map((i) => ({ label: i.name, href: `${BASE}/industries#${i.slug}`, note: i.line })),
      { label: "Women’s safety", href: `${BASE}/industries#womens-safety`, note: "Women’s posts, guarded by women" },
      { label: "All industries", href: `${BASE}/industries`, note: "Different sites, one standard" },
    ],
  },
  { label: "Technology", href: `${BASE}/technology` },
  {
    label: "About",
    kind: "list",
    children: [
      { label: "About SDC", href: `${BASE}/about`, note: "Story, leadership and values" },
      { label: "Training", href: `${BASE}/training`, note: "Selection and the training cycle" },
      { label: "Clients", href: `${BASE}/clients`, note: "Organisations we have served" },
      { label: "Compliance", href: `${BASE}/compliance`, note: "Licences and registrations" },
      { label: "Contact", href: `${BASE}/contact`, note: "Phone, WhatsApp and office" },
    ],
  },
  {
    label: "Careers",
    kind: "list",
    children: [
      { label: "Careers at SDC", href: `${BASE}/careers`, note: "Roles, training and why join" },
      { label: "Open positions", href: "/careers", note: "Current openings in English, ಕನ್ನಡ, हिन्दी" },
      { label: "Apply online", href: CAREERS_APPLY_URL, note: "Two minutes on your phone, CV optional" },
    ],
  },
];
