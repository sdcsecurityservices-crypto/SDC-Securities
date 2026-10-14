// Content for the multi-page website (/v2). Copy is drawn from the current
// one-page site, the proofread old-site content (docs/old-site-content.md),
// the pitch deck and the brochure. Keep facts here so pages stay consistent.
import { company, whatsappLink } from "@/lib/company";

export { company, whatsappLink };

export const BASE = "/v2";
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
  { value: "1000+", label: "People deployed", note: "In uniform and on facility teams" },
  { value: "50+", label: "Organisations served", note: "Across Karnataka" },
  { value: "15", label: "Security specialisations", note: "From gates to campuses" },
  { value: "2019", label: "PSARA licence granted", note: company.psara },
];

export const iso = {
  standard: "ISO 9001:2015",
  number: "QMS24221266",
  body: "UKGC Assessment",
  validTo: "23 Dec 2027",
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
  photo: { src: string; alt: string; caption: string; width: number; height: number };
  related: ServiceSlug[];
  icon: "shield" | "building" | "sparkles" | "users" | "clipboard";
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
    photo: {
      src: "/images/team/guards-and-lady-guards.jpg",
      alt: "SDC guards in caps and lady guards in navy vests standing in line with ID cards",
      caption: "SDC guards and lady guards",
      width: 1600,
      height: 1174,
    },
    related: ["manpower", "facility-management", "payroll-compliance"],
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
    photo: {
      src: "/images/v2/extinguisher-briefing.jpg",
      alt: "An SDC trainer demonstrating a fire extinguisher to a group of guards and lady guards",
      caption: "Fire-safety practice with SDC teams",
      width: 1600,
      height: 1067,
    },
    related: ["housekeeping", "security", "manpower"],
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
    photo: {
      src: "/images/team/assembly-leadership.jpg",
      alt: "SDC guards, lady guards and supervisors lined up at morning assembly with the company's leadership in front",
      caption: "SDC teams at morning assembly",
      width: 1600,
      height: 1066,
    },
    related: ["facility-management", "manpower", "security"],
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
    photo: {
      src: "/images/team/guard-line.jpg",
      alt: "A long line of SDC guards in uniform standing at attention",
      caption: "SDC people on parade",
      width: 1600,
      height: 1066,
    },
    related: ["security", "housekeeping", "payroll-compliance"],
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
    photo: {
      src: "/images/team/leadership-briefing.jpg",
      alt: "SDC leadership briefing a formation of uniformed guards",
      caption: "Leadership briefing before a shift",
      width: 1600,
      height: 1066,
    },
    related: ["manpower", "security", "facility-management"],
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

export type ClientLogo = { name: string; file: string | null };
export const clientGroups: { sector: string; clients: ClientLogo[] }[] = [
  {
    sector: "Infrastructure & utilities",
    clients: [
      { name: "Namma Metro", file: "namma-metro.svg" },
      { name: "KPTCL", file: "kptcl.png" },
    ],
  },
  {
    sector: "Healthcare & education",
    clients: [
      { name: "R. L. Jalappa Hospital", file: "rl-jalappa.svg" },
      { name: "Sri Devaraj Urs Medical College", file: "sdumc.webp" },
    ],
  },
  {
    sector: "Homes, real estate & senior living",
    clients: [
      { name: "VBHC", file: "vbhc.svg" },
      { name: "Vedaanta Senior Living", file: "vedaanta.svg" },
      { name: "Indya Estates", file: "indya-estates.png" },
      { name: "RK Gardenia", file: "rk-gardenia.png" },
      { name: "Subha Builders & Developers", file: "subha.png" },
    ],
  },
  {
    sector: "Construction & electrical",
    clients: [
      { name: "Power Hills Construction", file: "power-hills.png" },
      { name: "Ramalingam Construction", file: "ramalingam.png" },
      { name: "Shrishaila Electricals", file: "shrishaila.png" },
    ],
  },
  {
    sector: "Industry & manufacturing",
    clients: [
      { name: "Milky Mist", file: "milky-mist.png" },
      { name: "Asal Foods", file: "asal.png" },
      { name: "Geltec", file: "geltec.png" },
      { name: "Saify Ind", file: "saify.png" },
      { name: "Universal Textile Mills", file: "utm.webp" },
      { name: "Jindal Naturecare Limited", file: "jindal-naturecare.png" },
    ],
  },
  {
    sector: "Clubs & hospitality",
    clients: [{ name: "Satellite Club", file: null }],
  },
];

export const featuredClients: ClientLogo[] = [
  { name: "Namma Metro", file: "namma-metro.svg" },
  { name: "R. L. Jalappa Hospital", file: "rl-jalappa.svg" },
  { name: "Sri Devaraj Urs Medical College", file: "sdumc.webp" },
  { name: "KPTCL", file: "kptcl.png" },
  { name: "Milky Mist", file: "milky-mist.png" },
  { name: "Vedaanta Senior Living", file: "vedaanta.svg" },
  { name: "VBHC", file: "vbhc.svg" },
  { name: "Universal Textile Mills", file: "utm.webp" },
];

export const moreClients = [
  "VBHC",
  "Asal Foods",
  "Indya Estates",
  "Jindal Naturecare",
  "RK Gardenia",
  "Power Hills Construction",
  "Shrishaila Electricals",
  "Satellite Club",
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

export type NavItem = { label: string; href: string; note?: string };
export const nav: { label: string; href?: string; children?: NavItem[] }[] = [
  {
    label: "Services",
    href: `${BASE}/services`,
    children: [
      { label: "All services", href: `${BASE}/services`, note: "One partner, every layer" },
      ...services.map((s) => ({ label: s.name, href: `${BASE}/services/${s.slug}`, note: s.headline.join(" ") })),
    ],
  },
  {
    label: "Industries",
    href: `${BASE}/industries`,
    children: [
      { label: "All industries", href: `${BASE}/industries`, note: "Different sites, one standard" },
      ...industries.map((i) => ({ label: i.name, href: `${BASE}/industries#${i.slug}`, note: i.line })),
    ],
  },
  { label: "Training", href: `${BASE}/training` },
  { label: "Technology", href: `${BASE}/technology` },
  {
    label: "Company",
    children: [
      { label: "About SDC", href: `${BASE}/about`, note: "Story, leadership and values" },
      { label: "Clients", href: `${BASE}/clients`, note: "Organisations we have served" },
      { label: "Compliance", href: `${BASE}/compliance`, note: "Licences and registrations" },
      { label: "Careers", href: `${BASE}/careers`, note: "Serve with pride" },
    ],
  },
  { label: "Contact", href: `${BASE}/contact` },
];
