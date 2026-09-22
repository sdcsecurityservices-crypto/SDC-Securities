"use client";
import { useCallback, useEffect, useState } from "react";
import { MapPin, Camera, RefreshCw, ShieldCheck } from "lucide-react";
import { request } from "@/components/operations/shell";
import {
  queued,
  savePending,
  removePending,
  type PendingAttendance,
} from "@/lib/attendance/queue";
import "@/components/operations/shell.css";
// Schema-driven forms consume records validated by the resource-specific Zod API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export default function Attendance() {
  const [context, setContext] = useState<Row | null>(null),
    [site, setSite] = useState(""),
    [photo, setPhoto] = useState<File | null>(null),
    [pending, setPending] = useState<PendingAttendance[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [online, setOnline] = useState(true);
  const refresh = useCallback(async () => setPending(await queued()), []);
  useEffect(() => {
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const change = () => setOnline(navigator.onLine);
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    void refresh();
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker
        .register("/attendance-sw.js", { scope: "/attendance" })
        .catch(() => {});
    async function init() {
      try {
        const d = await request("/api/foundation/context"),
          m = d.memberships.find((x: Row) => x.role === "employee");
        if (!m)
          throw Error(
            "Sign in with your linked employee account to record attendance.",
          );
        const [e, s] = await Promise.all([
          request(`/api/employees/employees?tenant=${m.tenant_id}`),
          request(`/api/field/context?tenant=${m.tenant_id}`),
        ]);
        if (e.rows.length !== 1)
          throw Error("Your account must be linked to one employee.");
        const c = {
          tenant: m.tenant_id,
          employee: e.rows[0].id,
          name: e.rows[0].full_name,
          sites: s.sites,
        };
        setContext(c);
        setSite(c.sites[0]?.id || "");
        localStorage.setItem("sdc-attendance-context", JSON.stringify(c));
      } catch (e) {
        if (!navigator.onLine) {
          const old = localStorage.getItem("sdc-attendance-context");
          if (old) {
            const c = JSON.parse(old);
            setContext(c);
            setSite(c.sites[0]?.id || "");
            return;
          }
        }
        setError((e as Error).message);
      }
    }
    void init();
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  }, [refresh]);
  const capture = async (action: "check_in" | "check_out") => {
    setBusy(true);
    setError("");
    try {
      if (!context || !site) throw Error("Select an assigned site");
      if (action === "check_in" && !photo)
        throw Error("Take a selfie before checking in");
      const p = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }),
      );
      if (p.coords.accuracy > 100)
        throw Error("GPS is not accurate enough. Move outdoors and try again.");
      await savePending({
        id: crypto.randomUUID(),
        tenant: context.tenant,
        employee: context.employee,
        site,
        action,
        captured_at: new Date().toISOString(),
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        accuracy: p.coords.accuracy,
        photo: photo || undefined,
      });
      setPhoto(null);
      setMessage(
        "Captured on this device. Sync within 24 hours; manager review is required.",
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const sync = useCallback(async () => {
    if (!context || !navigator.onLine) return;
    setBusy(true);
    setError("");
    try {
      for (const event of await queued()) {
        if (
          event.tenant !== context.tenant ||
          event.employee !== context.employee
        )
          continue;
        try {
          let doc = event.document_id || null;
          if (event.action === "check_in" && !doc) {
            if (!event.photo) throw Error("Selfie evidence is missing");
            const f = new FormData();
            f.set("tenant", event.tenant);
            f.set("employee", event.employee);
            f.set("category", "selfie");
            f.set("title", "Offline attendance selfie");
            f.set("file", event.photo, "selfie.jpg");
            const r = await fetch("/api/employee-files", {
                method: "POST",
                body: f,
              }),
              d = (await r.json()) as Row;
            if (!r.ok) throw Error(d.error);
            doc = d.id;
            event.document_id = doc!;
            await savePending({ ...event, document_id: doc! });
          }
          await request("/api/offline-attendance", {
            tenant_id: event.tenant,
            event_id: event.id,
            employee_id: event.employee,
            site_id: event.site,
            action: event.action,
            captured_at: event.captured_at,
            latitude: event.latitude,
            longitude: event.longitude,
            accuracy: event.accuracy,
            document_id: doc,
          });
          await removePending(event.id);
        } catch (e) {
          await savePending({ ...event, error: (e as Error).message });
          break;
        }
      }
      await refresh();
      setMessage(
        "Sync completed. Submitted attendance awaits manager approval.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [context, refresh]);
  useEffect(() => {
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (online && context) void sync();
  }, [online, context, sync]);
  return (
    <div
      className="ops-app"
      style={{ minHeight: "100vh", padding: "28px 18px" }}
    >
      <main style={{ maxWidth: 540, margin: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 30,
          }}
        >
          <img alt="SDC" src="/brand/sdc-logo.png" width={52} />
          <div>
            <strong style={{ fontSize: 22 }}>SDC Guard Attendance</strong>
            <p style={{ color: "#52677f" }}>Your duty. Your record.</p>
          </div>
        </div>
        <div className="ops-card">
          <span className={`ops-badge ${online ? "good" : "warn"}`}>
            {online ? "Online" : "Offline · stored on this device"}
          </span>
          <h1 style={{ fontSize: 28, margin: "20px 0" }}>
            {context?.name || "Record your attendance"}
          </h1>
          <div
            className="ops-form"
            style={{ display: "block", maxHeight: "none" }}
          >
            <label>
              Assigned site
              <select value={site} onChange={(e) => setSite(e.target.value)}>
                {context?.sites.map((s: Row) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ marginTop: 20 }}>
              <span>
                <Camera size={17} style={{ display: "inline" }} /> Take a fresh
                selfie
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                capture="user"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <p style={{ margin: "20px 0", fontSize: 13 }}>
            <MapPin size={16} style={{ display: "inline" }} /> GPS and selfie
            evidence are checked against the assigned site. Offline captures are
            stored locally and require manager review.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="ops-button"
              disabled={busy || !context}
              onClick={() => void capture("check_in")}
            >
              Check in
            </button>
            <button
              className="ops-button secondary"
              disabled={busy || !context}
              onClick={() => void capture("check_out")}
            >
              Check out
            </button>
          </div>
          {error && (
            <p className="ops-error" role="alert">
              {error} <a href="/login">Sign in</a>
            </p>
          )}
          {message && (
            <p className="ops-success" role="status">
              {message}
            </p>
          )}
        </div>
        <div className="ops-card" style={{ marginTop: 20 }}>
          <h2>
            Pending sync ·{" "}
            {pending.filter((e) => e.employee === context?.employee).length}
          </h2>
          {pending
            .filter((e) => e.employee === context?.employee)
            .map((e) => (
              <div
                key={e.id}
                style={{ padding: "12px 0", borderBottom: "1px solid #d5dfeb" }}
              >
                <strong>{e.action.replace("_", " ")}</strong>
                <p>
                  {new Date(e.captured_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </p>
                {e.error && <p className="ops-error">{e.error}</p>}
                <button
                  className="ops-button secondary"
                  onClick={async () => {
                    if (
                      confirm(
                        "Discard this unsynced attendance capture and its selfie?",
                      )
                    ) {
                      await removePending(e.id);
                      await refresh();
                    }
                  }}
                >
                  Discard capture
                </button>
              </div>
            ))}
          <button
            style={{ marginTop: 18 }}
            className="ops-button"
            disabled={busy || !online}
            onClick={() => void sync()}
          >
            <RefreshCw size={16} />
            Sync now
          </button>
        </div>
        <a
          className="ops-button secondary"
          style={{ marginTop: 20 }}
          href="/deployment"
        >
          <ShieldCheck size={17} />
          View my roster
        </a>
      </main>
    </div>
  );
}
