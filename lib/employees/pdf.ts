import { randomBytes } from "node:crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { readFileSync } from "node:fs";
import path from "node:path";
export const inr = (n: number) =>
  `INR ${(n / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Doc = InstanceType<typeof PDFDocument>;
type Section = { heading: string; lines: string[] };
type Field = { label: string; value: string };
type Row = { name: string; fields: Field[] };
export type PdfOptions = {
  /** Name of the thing each table row describes, e.g. "Site". */
  rowLabel?: string;
  layout?: "certificate";
};

const C = {
  navy: "#0a2e59",
  navyDeep: "#071f3d",
  ink: "#1e293b",
  muted: "#64748b",
  soft: "#b8c6da",
  line: "#dbe3ec",
  panel: "#f4f7fb",
  gold: "#e2b100",
  goldSoft: "#fff6d1",
  alert: "#b45309",
  alertSoft: "#fdecc8",
};
const A4 = { w: 595.28, h: 841.89 },
  M = 45,
  CW = A4.w - 2 * M,
  BOTTOM = 772;
const BOLD = "Helvetica-Bold",
  REG = "Helvetica",
  ITALIC = "Helvetica-Oblique";

// "Label: value" lines become fields; "a: 1 | b: 2" lines become several.
const field = (s: string): Field | null => {
  const m = /^([A-Za-z][\w ()%/&.'+-]{0,40}):\s+(.*)$/.exec(s.trim());
  return m ? { label: m[1].trim(), value: m[2].trim() || "—" } : null;
};
const fields = (s: string): Field[] | null => {
  const parts = s.split(/\s+\|\s+/).map(field);
  return parts.every(Boolean) ? (parts as Field[]) : null;
};
const isSignature = (s: string) => /_{6,}/.test(s);
const num = (v: string) => {
  const t = v.replace(/^INR\s*/, "").replace(/,/g, "");
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null;
};
const isMoney = (v: string) => /^INR\s/.test(v);
const ALERT = /incident|risk|sos|offline|overdue|absent|unresolved/i;
const EMPHASIS = /^(total|net pay)/i;
const sameLabels = (a: Field[], b: Field[]) =>
  a.length === b.length && a.every((f, i) => f.label === b[i].label);
const ist = () =>
  new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) + " IST";

let logoCache: Buffer | null | undefined;
const logo = () => {
  if (logoCache === undefined) {
    try {
      logoCache = readFileSync(
        path.join(process.cwd(), "public/brand/sdc-logo.png"),
      );
    } catch {
      logoCache = null;
    }
  }
  return logoCache;
};

function collect(doc: Doc) {
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function emblem(doc: Doc, cx: number, cy: number, r: number) {
  doc.circle(cx, cy, r).fill("#ffffff");
  const l = logo();
  if (l)
    try {
      doc.image(l, cx - r * 0.78, cy - r * 0.78, { width: r * 1.56 });
    } catch {}
}

function coverHeader(doc: Doc, title: string) {
  doc.font(BOLD).fontSize(24);
  const titleH = doc.heightOfString(title, { width: CW - 20 });
  const band = Math.max(150, 112 + titleH + 22);
  doc.rect(0, 0, A4.w, band).fill(C.navy);
  doc.save();
  doc.circle(A4.w - 30, 10, 150).fillOpacity(0.05).fill("#ffffff");
  doc.circle(A4.w - 30, 10, 95).fillOpacity(0.05).fill("#ffffff");
  doc.restore();
  doc.rect(0, band, A4.w, 4).fill(C.gold);
  emblem(doc, M + 20, 50, 21);
  doc
    .font(BOLD)
    .fontSize(10.5)
    .fillColor("#ffffff")
    .text("SDC SECURITY SERVICES", M + 52, 39, {
      characterSpacing: 1.6,
      lineBreak: false,
    });
  doc
    .font(REG)
    .fontSize(7)
    .fillColor(C.soft)
    .text("SECURITY  ·  FACILITY  ·  MANPOWER  ·  BENGALURU", M + 52, 55, {
      characterSpacing: 1.1,
      lineBreak: false,
    });
  // Confidential tag, top right
  doc.font(BOLD).fontSize(6.5);
  const tag = "CONFIDENTIAL",
    tw = doc.widthOfString(tag, { characterSpacing: 1.2 }) + 18;
  doc
    .roundedRect(A4.w - M - tw, 40, tw, 17, 8.5)
    .lineWidth(0.8)
    .strokeColor(C.gold)
    .stroke();
  doc
    .fillColor(C.gold)
    .text(tag, A4.w - M - tw + 9, 45.5, {
      characterSpacing: 1.2,
      lineBreak: false,
    });
  doc
    .font(BOLD)
    .fontSize(7.5)
    .fillColor(C.gold)
    .text(`GENERATED ${ist().toUpperCase()}`, M, 94, {
      characterSpacing: 1.2,
      lineBreak: false,
    });
  doc
    .font(BOLD)
    .fontSize(24)
    .fillColor("#ffffff")
    .text(title, M, 110, { width: CW - 20 });
  doc.x = M;
  doc.y = band + 30;
}

function runningHeader(doc: Doc, title: string) {
  doc.rect(0, 0, A4.w, 34).fill(C.navy);
  doc.rect(0, 34, A4.w, 2).fill(C.gold);
  doc
    .font(BOLD)
    .fontSize(7.5)
    .fillColor("#ffffff")
    .text("SDC SECURITY SERVICES", M, 14, {
      characterSpacing: 1.4,
      lineBreak: false,
    });
  doc.font(REG).fontSize(8).fillColor(C.soft);
  const w = Math.min(doc.widthOfString(title), 300);
  doc.text(title, A4.w - M - w, 13.5, {
    width: w,
    lineBreak: false,
    ellipsis: true,
  });
  doc.x = M;
  doc.y = 62;
}

function ensure(doc: Doc, h: number, title: string) {
  if (doc.y + h > BOTTOM) {
    doc.addPage();
    runningHeader(doc, title);
    return true;
  }
  return false;
}

function heading(doc: Doc, text: string, title: string) {
  doc.font(BOLD).fontSize(12.5);
  const h = doc.heightOfString(text, { width: CW - 12 });
  ensure(doc, h + 70, title);
  const y = doc.y;
  doc.rect(M, y + 1, 3.5, 13).fill(C.gold);
  doc.fillColor(C.navy).text(text, M + 12, y, { width: CW - 12 });
  doc
    .moveTo(M, doc.y + 5)
    .lineTo(M + CW, doc.y + 5)
    .lineWidth(0.6)
    .strokeColor(C.line)
    .stroke();
  doc.x = M;
  doc.y += 15;
}

function paragraph(doc: Doc, text: string, title: string) {
  doc.font(REG).fontSize(10);
  const h = doc.heightOfString(text, { width: CW, lineGap: 3 });
  ensure(doc, h + 6, title);
  doc.fillColor(C.ink).text(text, M, doc.y, { width: CW, lineGap: 3 });
  doc.y += 6;
}

function grid(doc: Doc, list: Field[], title: string) {
  const cols =
    list.length >= 3 && list.every((f) => f.value.length <= 22) ? 3 : 2;
  const gap = 10,
    cw = (CW - gap * (cols - 1)) / cols,
    pad = 10;
  for (let i = 0; i < list.length; i += cols) {
    const row = list.slice(i, i + cols);
    const hs = row.map((f) => {
      doc.font(BOLD).fontSize(6.8);
      const lh = doc.heightOfString(f.label.toUpperCase(), {
        width: cw - 2 * pad,
        characterSpacing: 0.8,
      });
      doc.font(BOLD).fontSize(EMPHASIS.test(f.label) ? 13 : 10.5);
      return lh + 4 + doc.heightOfString(f.value, { width: cw - 2 * pad });
    });
    const rh = Math.max(...hs) + 2 * pad;
    ensure(doc, rh + gap, title);
    const y = doc.y;
    row.forEach((f, j) => {
      const x = M + j * (cw + gap),
        strong = EMPHASIS.test(f.label),
        n = num(f.value),
        warn = ALERT.test(f.label) && n !== null && n > 0;
      doc.roundedRect(x, y, cw, rh, 5).fill(strong ? C.goldSoft : C.panel);
      if (strong) doc.rect(x, y + 6, 3, rh - 12).fill(C.gold);
      doc
        .font(BOLD)
        .fontSize(6.8)
        .fillColor(C.muted)
        .text(f.label.toUpperCase(), x + pad, y + pad, {
          width: cw - 2 * pad,
          characterSpacing: 0.8,
        });
      doc
        .font(BOLD)
        .fontSize(strong ? 13 : 10.5)
        .fillColor(warn ? C.alert : strong ? C.navy : C.ink)
        .text(f.value, x + pad, doc.y + 4, { width: cw - 2 * pad });
    });
    doc.x = M;
    doc.y = y + rh + gap;
  }
  doc.y += 2;
}

function signatures(doc: Doc, lines: string[], title: string) {
  const w = (CW - 30) / 2;
  for (let i = 0; i < lines.length; i += 2) {
    ensure(doc, 58, title);
    const y = doc.y;
    lines.slice(i, i + 2).forEach((l, j) => {
      const x = M + j * (w + 30),
        label = l.replace(/_{3,}/g, "").replace(/:\s*$/, "").trim();
      doc
        .moveTo(x, y + 30)
        .lineTo(x + w, y + 30)
        .lineWidth(0.8)
        .strokeColor(C.navy)
        .stroke();
      doc
        .font(BOLD)
        .fontSize(7)
        .fillColor(C.muted)
        .text(label.toUpperCase(), x, y + 36, {
          width: w,
          characterSpacing: 0.9,
        });
    });
    doc.x = M;
    doc.y = y + 58;
  }
}

function tiles(doc: Doc, items: Array<{ label: string; value: string }>, title: string) {
  if (!items.length) return;
  const gap = 10,
    w = (CW - gap * (items.length - 1)) / items.length,
    h = 62;
  ensure(doc, h + 18, title);
  const y = doc.y;
  items.forEach((t, i) => {
    const x = M + i * (w + gap);
    doc.roundedRect(x, y, w, h, 6).fill(i === 0 ? C.navy : C.panel);
    doc.rect(x + 12, y, 26, 3).fill(C.gold);
    doc
      .font(BOLD)
      .fontSize(22)
      .fillColor(i === 0 ? "#ffffff" : C.navy)
      .text(t.value, x + 12, y + 13, { width: w - 24, lineBreak: false });
    doc
      .font(BOLD)
      .fontSize(6.8)
      .fillColor(i === 0 ? C.soft : C.muted)
      .text(t.label.toUpperCase(), x + 12, y + 42, {
        width: w - 24,
        characterSpacing: 0.8,
        lineBreak: false,
        ellipsis: true,
      });
  });
  doc.x = M;
  doc.y = y + h + 18;
}

function table(doc: Doc, rows: Row[], title: string, rowLabel?: string) {
  const labels = rows[0].fields.map((f) => f.label),
    hasName = rows.some((r) => r.name),
    nameW = hasName ? (labels.length > 6 ? 118 : 160) : 0,
    colW = (CW - nameW) / labels.length,
    pad = labels.length > 6 ? 5 : 7;
  const numeric = labels.map((_, i) =>
    rows.every((r) => num(r.fields[i].value) !== null),
  );
  const money = labels.map((_, i) =>
    rows.every((r) => isMoney(r.fields[i].value)),
  );
  const cells = (name: string, values: string[]) => [
    ...(hasName ? [{ text: name, w: nameW, i: -1 }] : []),
    ...values.map((v, i) => ({ text: v, w: colW, i })),
  ];
  doc.font(BOLD).fontSize(6.6);
  const widest = Math.max(
    ...labels.flatMap((l) =>
      l
        .toUpperCase()
        .split(/\s+/)
        .map((w) => doc.widthOfString(w, { characterSpacing: 0.6 })),
    ),
  );
  const hs = Math.max(5, Math.min(6.6, (6.6 * (colW - 2 * pad - 1)) / widest));
  const header = () => {
    doc.font(BOLD).fontSize(hs);
    const hc = cells(hasName ? rowLabel || "Name" : "", labels);
    const h =
      Math.max(
        ...hc.map((c) =>
          doc.heightOfString(c.text.toUpperCase(), {
            width: c.w - 2 * pad,
            characterSpacing: hs < 6.6 ? 0.2 : 0.6,
          }),
        ),
      ) +
      2 * pad;
    ensure(doc, h + 30, title);
    const y = doc.y;
    doc.roundedRect(M, y, CW, h, 4).fill(C.navy);
    let x = M;
    for (const c of hc) {
      doc
        .font(BOLD)
        .fontSize(hs)
        .fillColor("#ffffff")
        .text(c.text.toUpperCase(), x + pad, y + pad, {
          width: c.w - 2 * pad,
          characterSpacing: hs < 6.6 ? 0.2 : 0.6,
          align: c.i >= 0 && numeric[c.i] ? "right" : "left",
        });
      x += c.w;
    }
    doc.y = y + h;
  };
  const draw = (
    name: string,
    values: string[],
    shade: string | null,
    strong: boolean,
  ) => {
    const cs = cells(name, values);
    const h =
      Math.max(
        ...cs.map((c) => {
          doc.font(c.i < 0 || strong ? BOLD : REG).fontSize(8.6);
          return doc.heightOfString(c.text, { width: c.w - 2 * pad });
        }),
      ) +
      2 * pad;
    if (ensure(doc, h, title)) header();
    const y = doc.y;
    if (shade) doc.rect(M, y, CW, h).fill(shade);
    let x = M;
    for (const c of cs) {
      const n = c.i >= 0 ? num(c.text) : null,
        warn = c.i >= 0 && !strong && ALERT.test(labels[c.i]) && n !== null && n > 0,
        right = c.i >= 0 && numeric[c.i];
      doc.font(c.i < 0 || strong || warn ? BOLD : REG).fontSize(8.6);
      if (warn) {
        const tw = doc.widthOfString(c.text) + 12;
        doc
          .roundedRect(x + c.w - pad - tw + 6, y + pad - 3, tw, 15, 7.5)
          .fill(C.alertSoft);
      }
      doc
        .fillColor(warn ? C.alert : c.i < 0 || strong ? C.navy : C.ink)
        .text(c.text, x + pad, y + pad, {
          width: c.w - 2 * pad,
          align: right ? "right" : "left",
        });
      x += c.w;
    }
    doc
      .moveTo(M, y + h)
      .lineTo(M + CW, y + h)
      .lineWidth(0.5)
      .strokeColor(C.line)
      .stroke();
    doc.y = y + h;
  };
  header();
  rows.forEach((r, k) =>
    draw(
      r.name,
      r.fields.map((f) => f.value),
      k % 2 ? C.panel : null,
      false,
    ),
  );
  if (rows.length > 1 && numeric.some(Boolean)) {
    const totals = labels.map((_, i) => {
      if (!numeric[i]) return "";
      const s = rows.reduce((a, r) => a + (num(r.fields[i].value) || 0), 0);
      return money[i]
        ? `INR ${s.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : s.toLocaleString("en-IN");
    });
    if (hasName) draw("Total", totals, C.goldSoft, true);
    else {
      const first = totals.findIndex((t) => t !== "");
      draw("", totals.map((t, i) => (i === 0 && first > 0 ? "Total" : t)), C.goldSoft, true);
    }
  }
  doc.x = M;
  doc.y += 18;
}

function callout(doc: Doc, label: string, amount: string, title: string) {
  ensure(doc, 84, title);
  const y = doc.y;
  doc.roundedRect(M, y, CW, 70, 8).fill(C.navy);
  doc.rect(M, y + 14, 4, 42).fill(C.gold);
  doc
    .font(BOLD)
    .fontSize(7.5)
    .fillColor(C.gold)
    .text(label.toUpperCase(), M + 22, y + 16, { characterSpacing: 1.2 });
  doc
    .font(BOLD)
    .fontSize(24)
    .fillColor("#ffffff")
    .text(amount, M + 22, y + 32, { width: CW - 44, lineBreak: false });
  doc.x = M;
  doc.y = y + 84;
}

async function verification(doc: Doc, url: string, title: string) {
  const qr = await QRCode.toBuffer(url, {
    width: 240,
    margin: 1,
    color: { dark: C.navy, light: "#ffffff" },
  });
  ensure(doc, 126, title);
  const y = doc.y + 4;
  doc.roundedRect(M, y, CW, 112, 8).lineWidth(0.8).strokeColor(C.line).stroke();
  doc.rect(M, y + 16, 3.5, 80).fill(C.gold);
  doc.image(qr, M + 18, y + 11, { width: 90 });
  doc
    .font(BOLD)
    .fontSize(12)
    .fillColor(C.navy)
    .text("Scan to verify", M + 126, y + 26);
  doc
    .font(REG)
    .fontSize(8.5)
    .fillColor(C.muted)
    .text(
      "Point a phone camera at the code to open the live record in SDC Command.",
      M + 126,
      y + 44,
      { width: CW - 146 },
    );
  doc
    .font(REG)
    .fontSize(7)
    .fillColor(C.soft)
    .text(url, M + 126, y + 74, { width: CW - 146, height: 26, ellipsis: true });
  doc.x = M;
  doc.y = y + 126;
}

function section(doc: Doc, s: Section, title: string) {
  const lines = s.lines.filter((l) => l && l.trim());
  if (
    /net pay|amount due|total payable/i.test(s.heading) &&
    lines[0] &&
    isMoney(lines[0])
  ) {
    callout(doc, s.heading, lines[0], title);
    for (const l of lines.slice(1)) paragraph(doc, l, title);
    doc.y += 6;
    return;
  }
  heading(doc, s.heading, title);
  let i = 0;
  while (i < lines.length) {
    const l = lines[i],
      multi = fields(l);
    if (isSignature(l)) {
      const run: string[] = [];
      while (i < lines.length && isSignature(lines[i])) run.push(lines[i++]);
      signatures(doc, run, title);
    } else if (multi && multi.length > 1) {
      const rows: Row[] = [];
      while (i < lines.length) {
        const f = fields(lines[i]);
        if (!f || !sameLabels(f, multi)) break;
        rows.push({ name: "", fields: f });
        i++;
      }
      if (rows.length > 1) table(doc, rows, title);
      else grid(doc, rows[0].fields, title);
    } else if (multi) {
      const run: Field[] = [];
      while (i < lines.length && !isSignature(lines[i])) {
        const f = fields(lines[i]);
        if (!f || f.length !== 1) break;
        run.push(f[0]);
        i++;
      }
      grid(doc, run, title);
    } else {
      paragraph(doc, l, title);
      i++;
    }
  }
  doc.y += 10;
}

// Consecutive sections that share the same short "Label: value" lines read
// better as one table (sites, guards, records), with totals and summary tiles.
function plan(sections: Section[]) {
  const parsed = sections.map((s) => {
    const fl = s.lines.filter((l) => l && l.trim()).map(fields);
    return fl.length && fl.every(Boolean) ? (fl as Field[][]).flat() : null;
  });
  const out: Array<{ table: Row[] } | { section: Section }> = [];
  for (let i = 0; i < sections.length; ) {
    const f = parsed[i];
    let j = i + 1;
    if (
      f &&
      f.length >= 2 &&
      f.length <= 8 &&
      f.every((x) => x.value.length <= 28)
    )
      while (
        j < sections.length &&
        parsed[j] &&
        sameLabels(parsed[j]!, f) &&
        parsed[j]!.every((x) => x.value.length <= 28)
      )
        j++;
    if (j - i >= 2) {
      out.push({
        table: sections
          .slice(i, j)
          .map((s, k) => ({ name: s.heading, fields: parsed[i + k]! })),
      });
      i = j;
    } else out.push({ section: sections[i++] });
  }
  return out;
}

function finish(doc: Doc, title: string) {
  const pages = doc.bufferedPageRange(),
    stamp = new Date().toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    draft = /draft/i.test(title);
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    if (draft) {
      doc.save();
      doc.rotate(-35, { origin: [A4.w / 2, A4.h / 2] });
      doc
        .font(BOLD)
        .fontSize(110)
        .fillColor(C.navy)
        .fillOpacity(0.05)
        .text("DRAFT", 0, A4.h / 2 - 55, {
          width: A4.w,
          align: "center",
          lineBreak: false,
        });
      doc.restore();
    }
    doc
      .moveTo(M, 806)
      .lineTo(M + CW, 806)
      .lineWidth(0.6)
      .strokeColor(C.line)
      .stroke();
    doc.rect(M, 805, 26, 2).fill(C.gold);
    doc
      .font(BOLD)
      .fontSize(7)
      .fillColor(C.navy)
      .text("SDC SECURITY SERVICES", M, 815, {
        characterSpacing: 1,
        lineBreak: false,
      });
    doc
      .font(REG)
      .fontSize(7)
      .fillColor(C.muted)
      .text(`Confidential  ·  ${stamp}`, M + 118, 815, { lineBreak: false });
    const p = `Page ${i + 1} of ${pages.count}`;
    doc.font(BOLD).fontSize(7);
    doc
      .fillColor(C.navy)
      .text(p, A4.w - M - doc.widthOfString(p), 815, { lineBreak: false });
  }
}

async function certificate(
  doc: Doc,
  sections: Section[],
  verificationUrl?: string,
) {
  const W = A4.h,
    H = A4.w,
    cx = W / 2;
  doc.rect(0, 0, W, H).fill("#fffdf7");
  doc.rect(16, 16, W - 32, H - 32).lineWidth(3).strokeColor(C.navy).stroke();
  doc.rect(25, 25, W - 50, H - 50).lineWidth(0.8).strokeColor(C.gold).stroke();
  for (const [x, y] of [
    [25, 25],
    [W - 25, 25],
    [25, H - 25],
    [W - 25, H - 25],
  ])
    doc.circle(x, y, 4).fill(C.gold);
  doc.circle(cx, 78, 30).fill(C.navy);
  emblem(doc, cx, 78, 25);
  const centre = (
    text: string,
    y: number,
    font: string,
    size: number,
    color: string,
    spacing = 0,
  ) =>
    doc
      .font(font)
      .fontSize(size)
      .fillColor(color)
      .text(text, 60, y, {
        width: W - 120,
        align: "center",
        characterSpacing: spacing,
      });
  const [who, record, ...rest] = sections;
  centre("SDC SECURITY SERVICES  ·  TRAINING ACADEMY", 122, BOLD, 8.5, C.gold, 2.4);
  centre("Certificate of Training", 140, BOLD, 32, C.navy);
  doc.rect(cx - 30, 186, 60, 2.5).fill(C.gold);
  centre("This is to certify that", 204, ITALIC, 12, C.muted);
  centre(who?.heading || "", 224, BOLD, 30, C.ink);
  const lines = (who?.lines || []).filter(Boolean);
  centre(lines[0] || "has successfully completed", 268, ITALIC, 12, C.muted);
  centre(lines.slice(1).join(" "), 288, BOLD, 18, C.navy);
  const list = (record?.lines || [])
    .map(field)
    .filter(Boolean) as Field[];
  if (list.length) {
    const bw = 150,
      total = bw * list.length,
      x0 = cx - total / 2,
      y = 345;
    doc
      .moveTo(x0, y - 10)
      .lineTo(x0 + total, y - 10)
      .lineWidth(0.6)
      .strokeColor(C.line)
      .stroke();
    list.forEach((f, i) => {
      const x = x0 + i * bw;
      doc
        .font(BOLD)
        .fontSize(6.8)
        .fillColor(C.muted)
        .text(f.label.toUpperCase(), x, y, {
          width: bw,
          align: "center",
          characterSpacing: 1,
        });
      doc
        .font(BOLD)
        .fontSize(10.5)
        .fillColor(C.ink)
        .text(f.value.charAt(0).toUpperCase() + f.value.slice(1), x, y + 13, {
          width: bw,
          align: "center",
        });
    });
    doc
      .moveTo(x0, y + 38)
      .lineTo(x0 + total, y + 38)
      .lineWidth(0.6)
      .strokeColor(C.line)
      .stroke();
  }
  doc
    .moveTo(80, 468)
    .lineTo(270, 468)
    .lineWidth(0.8)
    .strokeColor(C.navy)
    .stroke();
  doc
    .font(BOLD)
    .fontSize(7)
    .fillColor(C.muted)
    .text("AUTHORISED SIGNATORY", 80, 475, { width: 190, characterSpacing: 1 });
  doc
    .font(REG)
    .fontSize(7.5)
    .fillColor(C.muted)
    .text("SDC Training Academy, Bengaluru", 80, 487, { width: 190 });
  const note = rest
    .flatMap((s) => s.lines)
    .filter((l) => l && !/^https?:/.test(l))
    .join(" ");
  if (note)
    doc
      .font(ITALIC)
      .fontSize(7.5)
      .fillColor(C.muted)
      .text(note, 60, H - 62, { width: W - 120, align: "center" });
  if (verificationUrl) {
    const qr = await QRCode.toBuffer(verificationUrl, {
      width: 240,
      margin: 1,
      color: { dark: C.navy, light: "#ffffff" },
    });
    doc.image(qr, W - 160, 405, { width: 72 });
    doc
      .font(BOLD)
      .fontSize(6.5)
      .fillColor(C.muted)
      .text("SCAN TO VERIFY", W - 175, 482, {
        width: 102,
        align: "center",
        characterSpacing: 1,
      });
  }
}

export async function brandedPdf(
  title: string,
  sections: Array<{ heading: string; lines: string[] }>,
  password?: string,
  verificationUrl?: string,
  options: PdfOptions = {},
) {
  const landscape = options.layout === "certificate";
  const doc = new PDFDocument({
    size: "A4",
    layout: landscape ? "landscape" : "portrait",
    margin: landscape ? 0 : M,
    bufferPages: true,
    info: { Title: title, Author: "SDC Security Services", Creator: "SDC Command" },
    ...(password
      ? {
          userPassword: password,
          ownerPassword: randomBytes(32).toString("base64url"),
          pdfVersion: "1.7ext3" as const,
          permissions: {
            printing: "highResolution" as const,
            modifying: false,
            copying: false,
          },
        }
      : {}),
  });
  const done = collect(doc);
  if (landscape) {
    await certificate(doc, sections, verificationUrl);
    doc.end();
    return done;
  }
  coverHeader(doc, title);
  for (const block of plan(sections)) {
    if ("table" in block) {
      const rows = block.table,
        labels = rows[0].fields.map((f) => f.label),
        numeric = labels
          .map((l, i) => ({ l, i }))
          .filter(({ i }) => rows.every((r) => num(r.fields[i].value) !== null));
      const picks = [
        ...numeric.filter(({ l }) => !ALERT.test(l)).slice(0, 1),
        ...numeric.filter(({ l }) => ALERT.test(l)),
      ].slice(0, 3);
      tiles(
        doc,
        [
          {
            label: options.rowLabel ? options.rowLabel + "s" : "Records",
            value: String(rows.length),
          },
          ...picks.map(({ l, i }) => ({
            label: l,
            value: rows
              .reduce((a, r) => a + (num(r.fields[i].value) || 0), 0)
              .toLocaleString("en-IN"),
          })),
        ],
        title,
      );
      table(doc, rows, title, options.rowLabel);
    } else section(doc, block.section, title);
  }
  if (verificationUrl) await verification(doc, verificationUrl, title);
  finish(doc, title);
  doc.end();
  return done;
}

export async function identityPdf(
  employee: { full_name: string; employee_code: string; grade?: string },
  card: {
    serial: string;
    token: string;
    valid_until: string;
    issuer: string;
    blood_group: string;
    emergency_phone: string;
    photo_data?: string;
  },
  origin: string,
) {
  const width = 242.65,
    height = 153.07,
    doc = new PDFDocument({ size: [width, height], margin: 0 });
  const done = collect(doc);
  const qr = await QRCode.toBuffer(`${origin}/verify/${card.token}`, {
    width: 200,
    margin: 1,
    color: { dark: C.navy, light: "#ffffff" },
  });
  const band = (h: number) => {
    doc.rect(0, 0, width, h).fill(C.navy);
    doc.rect(0, h, width, 2).fill(C.gold);
    emblem(doc, 17, h / 2, 9.5);
    doc
      .font(BOLD)
      .fontSize(8)
      .fillColor("#ffffff")
      .text("SDC SECURITY SERVICES", 32, h / 2 - 7, {
        characterSpacing: 0.8,
        lineBreak: false,
      });
    doc
      .font(BOLD)
      .fontSize(5)
      .fillColor(C.gold)
      .text("EMPLOYEE IDENTITY CARD", 32, h / 2 + 3, {
        characterSpacing: 1,
        lineBreak: false,
      });
  };
  const label = (t: string, x: number, y: number) =>
    doc
      .font(BOLD)
      .fontSize(4.8)
      .fillColor(C.muted)
      .text(t.toUpperCase(), x, y, { characterSpacing: 0.7, lineBreak: false });
  // Front
  band(30);
  const tx = 72;
  doc.roundedRect(12, 40, 52, 62, 4).fill(C.panel);
  const initials = employee.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  doc
    .font(BOLD)
    .fontSize(18)
    .fillColor(C.soft)
    .text(initials, 12, 62, { width: 52, align: "center", lineBreak: false });
  if (card.photo_data) {
    try {
      doc.save();
      doc.roundedRect(13.5, 41.5, 49, 59, 3).clip();
      doc.image(Buffer.from(card.photo_data.split(",")[1], "base64"), 13.5, 41.5, {
        cover: [49, 59],
        align: "center",
        valign: "center",
      });
      doc.restore();
    } catch {}
  }
  doc.roundedRect(12, 40, 52, 62, 4).lineWidth(1).strokeColor(C.gold).stroke();
  doc
    .font(BOLD)
    .fontSize(10.5)
    .fillColor(C.navy)
    .text(employee.full_name, tx, 44, {
      width: width - tx - 12,
      height: 26,
      ellipsis: true,
    });
  doc
    .font(REG)
    .fontSize(7.5)
    .fillColor(C.ink)
    .text(employee.grade || "Security professional", tx, 72, {
      width: width - tx - 12,
      lineBreak: false,
      ellipsis: true,
    });
  label("Employee ID", tx, 86);
  doc
    .font(BOLD)
    .fontSize(9)
    .fillColor(C.navy)
    .text(employee.employee_code, tx, 93, { lineBreak: false });
  doc.rect(0, height - 26, width, 26).fill(C.panel);
  doc.rect(0, height - 26, 4, 26).fill(C.gold);
  label("Valid until", 12, height - 21);
  doc
    .font(BOLD)
    .fontSize(7.5)
    .fillColor(C.ink)
    .text(card.valid_until.split("-").reverse().join("-"), 12, height - 13, {
      lineBreak: false,
    });
  label("Serial", 110, height - 21);
  doc
    .font(BOLD)
    .fontSize(7.5)
    .fillColor(C.ink)
    .text(card.serial, 110, height - 13, {
      width: width - 122,
      lineBreak: false,
      ellipsis: true,
    });
  // Back
  doc.addPage({ size: [width, height], margin: 0 });
  band(24);
  const rows: Array<[string, string]> = [
    ["Blood group", card.blood_group || "Not recorded"],
    ["Emergency contact", card.emergency_phone || "Contact SDC"],
    ["Issued by", card.issuer],
  ];
  rows.forEach(([k, v], i) => {
    const y = 34 + i * 20;
    label(k, 12, y);
    doc
      .font(BOLD)
      .fontSize(7.5)
      .fillColor(C.ink)
      .text(v, 12, y + 7, { width: 148, lineBreak: false, ellipsis: true });
  });
  doc.roundedRect(166, 32, 64, 64, 4).fill("#ffffff");
  doc.roundedRect(166, 32, 64, 64, 4).lineWidth(0.8).strokeColor(C.line).stroke();
  doc.image(qr, 169, 35, { width: 58 });
  label("Scan to verify", 170, 99);
  doc
    .moveTo(12, 108)
    .lineTo(130, 108)
    .lineWidth(0.6)
    .strokeColor(C.navy)
    .stroke();
  label("Authorised signature", 12, 111);
  doc.rect(0, height - 24, width, 24).fill(C.panel);
  doc
    .font(REG)
    .fontSize(5.6)
    .fillColor(C.muted)
    .text(
      "This card is company property and must be returned on leaving employment. Scan the code to confirm current validity.",
      12,
      height - 19,
      { width: width - 24, height: 16 },
    );
  doc.end();
  return done;
}
