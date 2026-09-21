import { randomBytes } from "node:crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { readFileSync } from "node:fs";
import path from "node:path";
export const inr = (n: number) =>
  `INR ${(n / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export async function brandedPdf(
  title: string,
  sections: Array<{ heading: string; lines: string[] }>,
  password?: string,
) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 45,
    bufferPages: true,
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
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  try {
    doc.image(
      readFileSync(path.join(process.cwd(), "public/brand/sdc-logo.png")),
      45,
      35,
      { width: 42 },
    );
  } catch {}
  doc.fillColor("#0a2e59").fontSize(19).text("SDC SECURITY SERVICES", 100, 42);
  doc
    .fontSize(9)
    .fillColor("#64748b")
    .text("CONNECTED OPERATIONS • BENGALURU", 100, 66);
  doc.moveTo(45, 100).lineTo(550, 100).strokeColor("#dbe3ec").stroke();
  doc.y = 120;
  doc.fontSize(22).fillColor("#0a2e59").text(title);
  doc.moveDown();
  for (const section of sections) {
    if (doc.y > 680) doc.addPage();
    doc.fontSize(12).fillColor("#0a2e59").text(section.heading);
    doc.moveDown(0.4);
    for (const line of section.lines) {
      doc.fontSize(10).fillColor("#334155").text(line, { lineGap: 5 });
    }
    doc.moveDown();
  }
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor("#64748b")
      .text(
        `SDC • Confidential • ${new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" })} • ${i + 1}/${pages.count}`,
        45,
        795,
        { lineBreak: false },
      );
  }
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
    doc = new PDFDocument({ size: [width, height], margin: 12 }),
    chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const qr = await QRCode.toBuffer(`${origin}/verify/${card.token}`, {
    width: 180,
    margin: 1,
  });
  doc.rect(0, 0, width, 32).fill("#0a2e59");
  doc.fontSize(10).fillColor("white").text("SDC SECURITY SERVICES", 12, 10);
  doc.fontSize(6).text("EMPLOYEE IDENTITY CARD", 12, 23);
  if (card.photo_data) {
    try {
      doc.image(Buffer.from(card.photo_data.split(",")[1], "base64"), 12, 42, {
        fit: [48, 57],
      });
    } catch {}
  }
  doc
    .fillColor("#0a2e59")
    .fontSize(11)
    .text(employee.full_name, card.photo_data ? 68 : 12, 45, {
      width: 145,
      height: 26,
      ellipsis: true,
    });
  doc
    .fontSize(8)
    .text(
      employee.grade || "Security professional",
      card.photo_data ? 68 : 12,
      74,
    );
  doc.fontSize(9).text(employee.employee_code, 12, 107);
  doc
    .fontSize(7)
    .fillColor("#64748b")
    .text(
      `Valid until ${card.valid_until.split("-").reverse().join("-")} • ${card.serial}`,
      12,
      130,
    );
  doc.addPage({ size: [width, height], margin: 12 });
  doc.image(qr, 168, 34, { width: 60 });
  doc
    .fillColor("#0a2e59")
    .fontSize(8)
    .text(`Blood group: ${card.blood_group || "Not recorded"}`, 12, 20, {
      width: 150,
    });
  doc.text(`Emergency: ${card.emergency_phone || "Contact SDC"}`, 12, 38, {
    width: 150,
  });
  doc.text(`Issued by: ${card.issuer}`, 12, 65, {
    width: 145,
    height: 22,
    ellipsis: true,
  });
  doc
    .fontSize(6)
    .text("Authorised signature: __________________", 12, 91, { width: 145 });
  doc
    .fontSize(7)
    .fillColor("#64748b")
    .text(
      "Scan to verify current validity. This card is company property. Return it upon leaving employment.",
      12,
      111,
      { width: 215, height: 30 },
    );
  doc.end();
  return done;
}
