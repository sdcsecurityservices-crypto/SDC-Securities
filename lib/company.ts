// Public contact and registration details shown on the website. These match
// SDC's published materials; update here to change them everywhere.
export const company = {
  name: "SDC Security & Facility Services Pvt. Ltd.",
  shortName: "SDC",
  phoneDisplay: "+91 99803 43925",
  phone: "+919980343925",
  // Assumes the office number is on WhatsApp; confirm before launch.
  whatsapp: "919980343925",
  email: "sdcpvtltd01@gmail.com",
  address: {
    street: "No. 102, Kempamma Layout, Mariyappana Palya",
    locality: "Bengaluru",
    region: "Karnataka",
    postalCode: "560056",
    country: "IN",
  },
  psara: "ISD/PSA-64/2019",
  cin: "U74999KA2017PTC103762",
} as const;

export const whatsappLink = (text: string) =>
  `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(text)}`;
