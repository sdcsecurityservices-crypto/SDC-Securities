import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
} from "node:crypto";
function key() {
  const value = process.env.SDC_EMPLOYEE_ENCRYPTION_KEY;
  if (!value) throw Error("Private employee storage is not configured.");
  const k = Buffer.from(value, "base64");
  if (k.length !== 32) throw Error("Invalid private storage key.");
  return k;
}
export function seal(value: unknown, context: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(context));
  const data = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    data.toString("base64url"),
  ].join(".");
}
export function unseal(value: string, context: string) {
  const [version, iv, tag, data] = value.split(".");
  if (version !== "v1") throw Error("Unknown encrypted record format.");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64url"),
  );
  cipher.setAAD(Buffer.from(context));
  cipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(
    Buffer.concat([
      cipher.update(Buffer.from(data, "base64url")),
      cipher.final(),
    ]).toString("utf8"),
  );
}
export function documentPassword(
  tenant: string,
  employee: string,
  document: string,
) {
  return createHmac("sha256", key())
    .update(`payslip:${tenant}:${employee}:${document}`)
    .digest("base64url")
    .slice(0, 18);
}
export function masks(value: Record<string, unknown>) {
  return Object.fromEntries(
    ["aadhaar", "pan", "uan", "esic", "bank_account", "arms_licence"].map(
      (k) => [
        k,
        value[k] ? `•••• ${String(value[k]).slice(-4)}` : "Not provided",
      ],
    ),
  );
}
