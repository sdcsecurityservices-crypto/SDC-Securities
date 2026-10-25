// The public web address. Links in search results, link previews and the
// sitemap use this, whatever host the app itself runs on (Railway behind
// the Vercel front door). APP_URL stays the app's own address for staff
// links such as activation emails and QR codes.
export const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://sdcsecurity.in").replace(/\/$/, "");
