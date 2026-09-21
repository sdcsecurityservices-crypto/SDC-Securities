import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export default async function Verify({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let card: {
    name: string;
    photo: string;
    status: string;
    valid_from: string;
    valid_until: string;
  } | null = null;
  if (
    /^[0-9a-f-]{36}$/i.test(token) &&
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_PUBLISHABLE_KEY
  ) {
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false } },
    );
    const { data } = await db.rpc("verify_employee_card", { p_token: token });
    card = data;
  }
  return (
    <main className="foundation-login">
      <Link href="/" className="login-brand">
        <img src="/brand/sdc-logo.png" alt="SDC" />
        <span>
          SDC <b>VERIFY</b>
        </span>
      </Link>
      <section>
        <span className="foundation-eyebrow">
          EMPLOYEE IDENTITY VERIFICATION
        </span>
        <h1>
          {card
            ? card.status === "valid"
              ? "Identity verified."
              : "Card is not valid."
            : "Card not found."}
        </h1>
        {card ? (
          <>
            <h2>{card.name}</h2>
            {card.photo && (
              <img src={card.photo} alt="Employee photograph" width={100} />
            )}
            <p>
              Status: <strong>{card.status.replaceAll("_", " ")}</strong>
            </p>
            <p>
              Validity: {card.valid_from} to {card.valid_until}
            </p>
          </>
        ) : (
          <p>This link does not identify an issued SDC employee card.</p>
        )}
      </section>
    </main>
  );
}
