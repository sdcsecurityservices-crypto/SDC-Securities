import { supabase } from "@/lib/supabase/server";
import { z } from "zod";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = z.string().uuid().safeParse(token);
  let record = null;
  if (valid.success) {
    const db = await supabase();
    const { data } = await db.rpc("training_verify", { p_token: token });
    record = data;
  }
  return (
    <main
      style={{
        maxWidth: 620,
        margin: "70px auto",
        padding: 30,
        color: "#123354",
      }}
    >
      <img src="/brand/sdc-logo.png" width={64} height={64} alt="SDC" />
      <h1 style={{ fontSize: 32, margin: "25px 0" }}>
        Training certificate verification
      </h1>
      {record ? (
        <>
          <strong style={{ textTransform: "uppercase", fontSize: 20 }}>
            {record.status}
          </strong>
          <h2 style={{ fontSize: 26, marginTop: 20 }}>{record.employee}</h2>
          <p>{record.course}</p>
          <p style={{ marginTop: 20 }}>
            Issued {record.issued_on}
            <br />
            Valid until {record.expires_on || "No expiry"}
          </p>
        </>
      ) : (
        <p>This certificate could not be verified.</p>
      )}
      <p style={{ marginTop: 35, color: "#53677e" }}>
        SDC Security Services · Training Academy
      </p>
    </main>
  );
}
