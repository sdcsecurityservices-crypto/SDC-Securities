"use client";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { homeFor, safeNext } from "@/lib/navigation";

async function destination() {
  const next = safeNext(new URLSearchParams(window.location.search).get("next"));
  if (next) return next;
  try {
    const r = await fetch("/api/foundation/context");
    const d = (await r.json()) as { memberships?: { role: string }[] };
    return homeFor(d.memberships?.[0]?.role);
  } catch {
    return "/control";
  }
}

export default function Login() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  return (
    <AuthLayout
      eyebrow="Connected operations"
      title="Sign in to SDC Command"
      lead="Use your individual SDC account. What you see depends on your role and assigned sites."
    >
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            const r = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: f.get("email"),
                password: f.get("password"),
              }),
            });
            const d = (await r.json().catch(() => ({}))) as { error?: string };
            if (!r.ok) throw Error(d.error || "Sign-in failed.");
            window.location.assign(await destination());
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <label>
          Work email
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            placeholder="you@company.com"
          />
        </label>
        <label>
          Password
          <span className="auth-password">
            <input
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        <button className="auth-submit" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="auth-spin" size={18} /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      <p className="auth-footnote">
        <ShieldCheck size={16} aria-hidden /> Accounts are issued by your
        administrator. Forgot your password? Ask them for a new activation link.
      </p>
    </AuthLayout>
  );
}
