"use client";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { homeFor } from "@/lib/navigation";

export default function Activate() {
  const [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    setToken(hash.get("token_hash") || "");
    window.history.replaceState(null, "", "/activate");
  }, []);
  return (
    <AuthLayout
      eyebrow="Your secure workspace"
      title="Welcome to SDC."
      lead="Choose a personal password to activate the account your administrator created for you."
    >
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (f.get("password") !== f.get("confirm")) {
            setError("Your passwords do not match.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/auth/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token_hash: token,
                password: f.get("password"),
              }),
            });
            const d = (await r.json().catch(() => ({}))) as { error?: string };
            if (!r.ok) throw Error(d.error || "Activation failed.");
            const c = await fetch("/api/foundation/context")
              .then((x) => x.json() as Promise<{ memberships?: { role: string }[] }>)
              .catch(() => ({ memberships: [] }));
            window.location.assign(homeFor(c.memberships?.[0]?.role));
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={256}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={256}
            required
          />
        </label>
        <p className="auth-hint">Use at least 12 characters.</p>
        {!token && (
          <p role="alert" className="auth-error">
            Open the private activation link from your invitation to continue.
          </p>
        )}
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        <button className="auth-submit" disabled={busy || !token}>
          {busy ? (
            <>
              <LoaderCircle className="auth-spin" size={18} /> Activating…
            </>
          ) : (
            "Activate account"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
