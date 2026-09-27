"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CloudOff,
  Flame,
  Fingerprint,
  GraduationCap,
  HeartPulse,
  Languages,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  Phone,
  QrCode,
  RefreshCw,
  Route,
  ScanLine,
  ShieldAlert,
  Siren,
  Trash2,
  User,
  X,
  Eye,
  Hammer,
  DoorOpen,
  PackageX,
  CircleHelp,
} from "lucide-react";
import {
  queued,
  savePending,
  removePending,
  updateIfQueued,
  requestBackgroundSync,
  type Pending,
} from "@/lib/attendance/queue";
import { languages, translate, type Key, type Lang } from "@/lib/guard/i18n";
import "./guard.css";

// API rows are validated server-side; the guard app reads a few known fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type Ctx = {
  tenant: string;
  employee: string;
  code: string;
  name: string;
  sites: Row[];
  duties: Row[];
  attendance: Row[];
  cachedAt: string;
};
type Tab = "duty" | "patrol" | "report" | "more";
type Fix = { latitude: number; longitude: number; accuracy: number };
type Flash = { tone: "good" | "warn" | "bad"; text: string } | null;

const CTX_KEY = "sdc-guard-context";
const LANG_KEY = "sdc-guard-lang";

/* ---------------- helpers ---------------- */
class NetworkError extends Error {}
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function api(path: string, body?: unknown | FormData) {
  let r: Response;
  try {
    r = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      cache: "no-store",
      headers: body === undefined || body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError("offline");
  }
  const d = (await r.json().catch(() => ({}))) as Row;
  if (!r.ok) throw new ApiError(d.error || `Request failed (${r.status})`, r.status);
  return d;
}
/** Network failures and server outages are retried; validation errors are not. */
const transient = (e: unknown) => e instanceof NetworkError || (e instanceof ApiError && e.status >= 500);

const istTime = (v: string | Date) =>
  new Date(v).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const istDay = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const dayLabel = (v: string) =>
  new Date(v + "T12:00:00+05:30").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

function metres(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.latitude - a.latitude),
    dLon = r(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h))));
}

/** Watch GPS until the fix is good enough or time runs out; return the best one. */
function getFix({ timeout = 15000, target = 30, max = 100 } = {}): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("gpsUnavailable"));
    let best: Fix | null = null;
    const done = (fix: Fix | null, err?: string) => {
      navigator.geolocation.clearWatch(id);
      clearTimeout(timer);
      if (fix && fix.accuracy <= max) resolve(fix);
      else reject(new Error(err || "gpsWeak"));
    };
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const fix = { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) };
        if (!best || fix.accuracy < best.accuracy) best = fix;
        if (fix.accuracy <= target) done(fix);
      },
      (e) => done(best, e.code === e.PERMISSION_DENIED ? "gpsDenied" : best ? undefined : "gpsWeak"),
      { enableHighAccuracy: true, maximumAge: 0, timeout },
    );
    const timer = setTimeout(() => done(best), timeout);
  });
}

/** Downscale a camera photo to ~720px JPEG so it uploads quickly on 2G/3G. */
async function compress(file: Blob, max = 720, quality = 0.72): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    return out && out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

function readCtx(): Ctx | null {
  try {
    return JSON.parse(localStorage.getItem(CTX_KEY) || "null");
  } catch {
    return null;
  }
}

/** Current time, refreshed every 30 seconds so duty windows stay accurate. */
function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/* ---------------- outbox sync (single flight) ---------------- */
let flight: Promise<void> | null = null;
async function uploadSelfie(tenant: string, employee: string, photo: Blob) {
  const f = new FormData();
  f.set("tenant", tenant);
  f.set("employee", employee);
  f.set("category", "selfie");
  f.set("title", "Attendance selfie");
  f.set("file", photo, "selfie.jpg");
  return (await api("/api/employee-files", f)).id as string;
}
function flushOutbox(ctx: Ctx) {
  if (flight) return flight;
  flight = (async () => {
    for (const e of await queued()) {
      if (e.failed || e.tenant !== ctx.tenant || e.employee !== ctx.employee) continue;
      try {
        if (e.kind === "sos") {
          await api("/api/field/sos", {
            tenant_id: e.tenant,
            data: { site_id: e.site, title: e.title, description: e.description, latitude: e.latitude, longitude: e.longitude },
          });
        } else {
          let doc = e.document_id || null;
          if (e.action === "check_in" && !doc) {
            if (!e.photo) throw new ApiError("Selfie evidence is missing", 400);
            doc = await uploadSelfie(e.tenant, e.employee, e.photo);
            await updateIfQueued(e.id, { document_id: doc });
          }
          await api("/api/offline-attendance", {
            tenant_id: e.tenant,
            event_id: e.id,
            employee_id: e.employee,
            site_id: e.site,
            action: e.action,
            captured_at: e.captured_at,
            latitude: e.latitude,
            longitude: e.longitude,
            accuracy: e.accuracy,
            document_id: doc,
          });
        }
        await removePending(e.id);
      } catch (err) {
        if (transient(err)) break; // try again when back online
        await updateIfQueued(e.id, { error: (err as Error).message, failed: true });
      }
    }
  })().finally(() => {
    flight = null;
  });
  return flight;
}

/* ---------------- app ---------------- */
export default function GuardApp() {
  const [lang, setLang] = useState<Lang>("en");
  const t = useCallback((k: Key, v?: Record<string, string | number>) => translate(lang, k, v), [lang]);
  const [ctx, setCtx] = useState<Ctx | null>(null),
    [fatal, setFatal] = useState(""),
    [tab, setTab] = useState<Tab>("duty"),
    [online, setOnline] = useState(true),
    [pending, setPending] = useState<Pending[]>([]),
    [flash, setFlash] = useState<Flash>(null),
    [syncing, setSyncing] = useState(false),
    [scanToken, setScanToken] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    try {
      setPending(await queued());
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setFatal("");
    try {
      const c = await api("/api/foundation/context");
      const m = (c.memberships as Row[]).find((x) => x.role === "employee");
      if (!m) throw new ApiError("needAccount", 403);
      const tenant = m.tenant_id as string;
      const e = await api(`/api/employees/employees?tenant=${tenant}`);
      if (e.rows.length !== 1) throw new ApiError("needAccount", 403);
      const me = e.rows[0];
      const [field, board, att] = await Promise.all([
        api(`/api/field/context?tenant=${tenant}`),
        api(`/api/roster/board?tenant=${tenant}&from=${istDay()}&days=7`).catch(() => ({ rows: [] })),
        api(`/api/employees/attendance?tenant=${tenant}&employee=${me.id}&limit=5`).catch(() => ({ rows: [] })),
      ]);
      const next: Ctx = {
        tenant,
        employee: me.id,
        code: me.employee_code,
        name: me.full_name,
        sites: field.sites || [],
        duties: (board.rows || []).filter((d: Row) => d.employee_id === me.id),
        attendance: att.rows || [],
        cachedAt: new Date().toISOString(),
      };
      setCtx(next);
      try {
        localStorage.setItem(CTX_KEY, JSON.stringify(next));
      } catch {}
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.replace("/login?next=/attendance");
        return;
      }
      const cached = readCtx();
      if (cached && transient(err)) setCtx(cached);
      else
        setFatal(
          err instanceof ApiError && err.message === "needAccount"
            ? "needAccount"
            : transient(err)
              ? "firstRunOffline"
              : (err as Error).message,
        );
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Lang | null;
      // Reads a per-device preference once on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && ["en", "kn", "hi"].includes(saved)) setLang(saved);
    } catch {}
    const cached = readCtx();
    if (cached) setCtx(cached);
    setOnline(navigator.onLine);
    const params = new URLSearchParams(window.location.search);
    const cp = params.get("checkpoint");
    if (cp) {
      setScanToken(cp);
      setTab("patrol");
      window.history.replaceState(null, "", "/attendance");
    }
    void load();
    void refreshQueue();
    const on = () => setOnline(true),
      off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/attendance-sw.js", { scope: "/attendance" }).catch(() => {});
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [load, refreshQueue]);

  const sync = useCallback(async () => {
    if (!ctx || !navigator.onLine) return;
    setSyncing(true);
    try {
      await flushOutbox(ctx);
    } finally {
      await refreshQueue();
      setSyncing(false);
    }
  }, [ctx, refreshQueue]);

  // Flush the outbox on reconnect, on focus, and when the service worker asks.
  useEffect(() => {
    if (!ctx) return;
    // Sending queued records is an external side effect of connectivity.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (online) void sync();
    const onVisible = () => document.visibilityState === "visible" && navigator.onLine && void sync();
    const onMessage = (e: MessageEvent) => e.data?.type === "sdc-sync" && void sync();
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [online, ctx, sync]);

  const mine = useMemo(
    () => pending.filter((e) => ctx && e.tenant === ctx.tenant && e.employee === ctx.employee),
    [pending, ctx],
  );

  const chooseLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  };

  if (fatal && !ctx)
    return (
      <main className="g-app g-state" lang={lang}>
        <img src="/brand/sdc-logo.png" alt="" width={64} height={64} />
        <p>{fatal === "needAccount" || fatal === "firstRunOffline" ? t(fatal) : fatal}</p>
        <div className="g-state-actions">
          {fatal === "needAccount" ? (
            <a className="g-btn g-primary" href="/login?next=/attendance">
              {t("signIn")}
            </a>
          ) : (
            <button className="g-btn g-primary" onClick={() => void load()}>
              <RefreshCw size={18} /> {t("retry")}
            </button>
          )}
        </div>
      </main>
    );
  if (!ctx)
    return (
      <main className="g-app g-state" lang={lang}>
        <LoaderCircle className="g-spin" size={28} />
        <p>{t("loading")}</p>
      </main>
    );

  return (
    <div className="g-app" lang={lang}>
      <header className="g-top">
        <img src="/brand/sdc-logo.png" alt="" width={36} height={36} />
        <div className="g-who">
          <strong>{ctx.name}</strong>
          <small>{ctx.code}</small>
        </div>
        {mine.length > 0 && (
          <button className="g-chip g-chip-warn" onClick={() => setTab("duty")}>
            <CloudOff size={14} /> {t("waitingSync", { n: mine.length })}
          </button>
        )}
        <span className={`g-chip ${online ? "g-chip-good" : "g-chip-off"}`}>
          <i /> {online ? t("online") : t("offline")}
        </span>
      </header>

      {flash && (
        <div className={`g-flash g-${flash.tone}`} role={flash.tone === "bad" ? "alert" : "status"}>
          {flash.tone === "good" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span>{flash.text}</span>
          <button aria-label={t("close")} onClick={() => setFlash(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      <main className="g-main">
        {tab === "duty" && (
          <DutyTab
            ctx={ctx}
            t={t}
            online={online}
            pending={mine}
            syncing={syncing}
            onSync={() => void sync()}
            onFlash={setFlash}
            onChanged={async () => {
              await refreshQueue();
              if (navigator.onLine) await load();
            }}
          />
        )}
        {tab === "patrol" && (
          <PatrolTab
            ctx={ctx}
            t={t}
            online={online}
            initialToken={scanToken}
            onConsumeToken={() => setScanToken(null)}
            onFlash={setFlash}
          />
        )}
        {tab === "report" && <ReportTab ctx={ctx} t={t} online={online} onFlash={setFlash} />}
        {tab === "more" && (
          <MoreTab
            t={t}
            lang={lang}
            onLang={chooseLang}
            pendingCount={mine.length}
          />
        )}
      </main>

      <SosButton ctx={ctx} t={t} onFlash={setFlash} onQueued={refreshQueue} />

      <nav className="g-tabs" aria-label="Guard app">
        {(
          [
            ["duty", Fingerprint],
            ["patrol", Route],
            ["report", ClipboardList],
            ["more", Menu],
          ] as const
        ).map(([k, Icon]) => (
          <button key={k} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>
            <Icon size={22} />
            <span>{t(k)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ---------------- Duty ---------------- */
function DutyTab({
  ctx,
  t,
  online,
  pending,
  syncing,
  onSync,
  onFlash,
  onChanged,
}: {
  ctx: Ctx;
  t: (k: Key, v?: Record<string, string | number>) => string;
  online: boolean;
  pending: Pending[];
  syncing: boolean;
  onSync: () => void;
  onFlash: (f: Flash) => void;
  onChanged: () => Promise<void>;
}) {
  const [photo, setPhoto] = useState<Blob | null>(null),
    [preview, setPreview] = useState(""),
    [busy, setBusy] = useState<"" | "locating" | "sending">(""),
    [fix, setFix] = useState<Fix | null>(null),
    [ackBusy, setAckBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const now = useNow();
  const today = istDay(new Date(now));
  const duty =
    ctx.duties.find((d) => new Date(d.starts_at).getTime() <= now + 3600_000 && new Date(d.ends_at).getTime() >= now) ||
    ctx.duties.find((d) => d.work_date === today);
  const upcoming = ctx.duties.filter((d) => d !== duty && new Date(d.starts_at).getTime() > now).slice(0, 5);
  const site =
    ctx.sites.find((s) => s.id === duty?.site_id) || (ctx.sites.length === 1 ? ctx.sites[0] : undefined);
  // Open check-in: server record, or a queued offline check-in awaiting sync.
  const openServer = ctx.attendance.find(
    (a) => a.check_in && !a.check_out && now - new Date(a.check_in).getTime() < 24 * 3600_000,
  );
  const queuedIn = [...pending]
    .reverse()
    .find((p) => p.kind !== "sos" && !p.failed) as Extract<Pending, { action: string }> | undefined;
  const onDuty = queuedIn ? queuedIn.action === "check_in" : !!openServer;
  const since = queuedIn?.action === "check_in" ? queuedIn.captured_at : openServer?.check_in;

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    // Object URLs are browser resources tied to the chosen photo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const gpsMessage = (e: unknown) => {
    const k = (e as Error).message;
    return ["gpsWeak", "gpsDenied", "gpsUnavailable"].includes(k) ? t(k as Key) : k;
  };

  async function submit(action: "check_in" | "check_out") {
    onFlash(null);
    setBusy("locating");
    let position: Fix;
    try {
      position = await getFix();
      setFix(position);
    } catch (e) {
      setBusy("");
      onFlash({ tone: "bad", text: gpsMessage(e) });
      return;
    }
    setBusy("sending");
    const siteId = site?.id || ctx.sites[0]?.id;
    const queue = async (document_id?: string) => {
      await savePending({
        id: crypto.randomUUID(),
        kind: "attendance",
        tenant: ctx.tenant,
        employee: ctx.employee,
        site: siteId,
        action,
        captured_at: new Date().toISOString(),
        ...position,
        photo: action === "check_in" ? photo || undefined : undefined,
        document_id,
      });
      await requestBackgroundSync();
      setPhoto(null);
      onFlash({ tone: "warn", text: t("savedOffline") });
      await onChanged();
    };
    let documentId: string | undefined;
    try {
      if (!navigator.onLine) return await queue();
      if (action === "check_in") documentId = await uploadSelfie(ctx.tenant, ctx.employee, photo!);
      await api("/api/employees/check_attendance", {
        tenant_id: ctx.tenant,
        employee_id: ctx.employee,
        action,
        ...position,
        document_id: documentId ?? null,
      });
      setPhoto(null);
      onFlash({ tone: "good", text: t(action === "check_in" ? "checkedIn" : "checkedOut", { t: istTime(new Date()) }) });
      if ("vibrate" in navigator) navigator.vibrate(60);
      await onChanged();
    } catch (e) {
      if (transient(e) && siteId) await queue(documentId);
      else onFlash({ tone: "bad", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  const distance = fix && site?.latitude != null ? metres(fix, { latitude: Number(site.latitude), longitude: Number(site.longitude) }) : null;

  return (
    <div className="g-stack">
      <section className="g-card g-duty">
        <p className="g-eyebrow">{t("todayDuty")}</p>
        {duty ? (
          <>
            <h1>{duty.site_name}</h1>
            <p className="g-muted">
              {duty.post_name} · {duty.shift_name}
            </p>
            <p className="g-time">
              {t("window", { a: istTime(duty.starts_at), b: istTime(duty.ends_at) })}
            </p>
            {!duty.acknowledged_at ? (
              <button
                className="g-btn g-outline g-sm"
                disabled={ackBusy || !online}
                onClick={async () => {
                  setAckBusy(true);
                  try {
                    await api("/api/roster/acknowledge", { tenant_id: ctx.tenant, id: duty.id });
                    await onChanged();
                  } catch (e) {
                    onFlash({ tone: "bad", text: (e as Error).message });
                  } finally {
                    setAckBusy(false);
                  }
                }}
              >
                <Check size={16} /> {t("acknowledge")}
              </button>
            ) : (
              <span className="g-pill g-pill-good">
                <Check size={14} /> {t("acknowledged")}
              </span>
            )}
          </>
        ) : (
          <>
            <h1>{t("noDutyToday")}</h1>
            <p className="g-muted">{t("noDutyHint")}</p>
          </>
        )}
      </section>

      <section className={`g-card g-status ${onDuty ? "is-on" : ""}`}>
        <div className="g-status-line">
          <span className="g-dot" />
          <strong>{onDuty && since ? t("onDutySince", { t: istTime(since) }) : t("notCheckedIn")}</strong>
        </div>

        {!onDuty && preview && (
          <div className="g-selfie">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" />
            <button className="g-link" onClick={() => fileRef.current?.click()} disabled={!!busy}>
              <Camera size={16} /> {t("retake")}
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) setPhoto(await compress(f));
          }}
        />

        {onDuty ? (
          <button className="g-hero g-hero-out" disabled={!!busy} onClick={() => void submit("check_out")}>
            {busy ? <LoaderCircle className="g-spin" size={26} /> : <LogOut size={26} />}
            <span>{busy === "locating" ? t("locating") : busy === "sending" ? t("syncing") : t("checkOut")}</span>
          </button>
        ) : photo ? (
          <button className="g-hero" disabled={!!busy} onClick={() => void submit("check_in")}>
            {busy ? <LoaderCircle className="g-spin" size={26} /> : <Fingerprint size={26} />}
            <span>{busy === "locating" ? t("locating") : busy === "sending" ? t("syncing") : t("confirmCheckIn")}</span>
          </button>
        ) : (
          <button className="g-hero" onClick={() => fileRef.current?.click()}>
            <Camera size={26} />
            <span>{t("takeSelfie")}</span>
          </button>
        )}

        <p className="g-gps">
          <MapPin size={15} />
          {fix ? (
            <>
              {t("gpsAccuracy", { m: fix.accuracy })}
              {distance != null && site && <> · {t("fromSite", { m: distance, site: site.name })}</>}
            </>
          ) : (
            site?.name || " "
          )}
        </p>
      </section>

      {pending.length > 0 && (
        <section className="g-card">
          <div className="g-row-between">
            <h2>{t("pending")}</h2>
            <button className="g-btn g-outline g-sm" disabled={syncing || !online} onClick={onSync}>
              <RefreshCw size={15} className={syncing ? "g-spin" : ""} /> {syncing ? t("syncing") : t("syncNow")}
            </button>
          </div>
          <ul className="g-list">
            {pending.map((p) => (
              <li key={p.id} className={p.failed ? "is-failed" : ""}>
                <span className="g-list-icon">{p.kind === "sos" ? <Siren size={18} /> : <Fingerprint size={18} />}</span>
                <div>
                  <strong>{p.kind === "sos" ? "SOS" : t(p.action === "check_in" ? "checkIn" : "checkOut")}</strong>
                  <small>
                    {istTime(p.captured_at)} · {p.failed ? `${t("failed")}: ${p.error}` : t("pending")}
                  </small>
                </div>
                {p.failed && (
                  <button
                    className="g-icon-btn"
                    aria-label={t("discard")}
                    onClick={async () => {
                      await removePending(p.id);
                      await onChanged();
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="g-card">
          <h2>{t("upcoming")}</h2>
          <ul className="g-list">
            {upcoming.map((d) => (
              <li key={d.id}>
                <span className="g-list-icon">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <strong>{d.site_name}</strong>
                  <small>
                    {dayLabel(d.work_date)} · {istTime(d.starts_at)} – {istTime(d.ends_at)} · {d.post_name}
                  </small>
                </div>
                {d.acknowledged_at && <Check size={17} className="g-good-text" />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------------- SOS ---------------- */
function SosButton({
  ctx,
  t,
  onFlash,
  onQueued,
}: {
  ctx: Ctx;
  t: (k: Key, v?: Record<string, string | number>) => string;
  onFlash: (f: Flash) => void;
  onQueued: () => Promise<void>;
}) {
  const HOLD = 1200;
  const [holding, setHolding] = useState(false),
    [sending, setSending] = useState(false),
    [sent, setSent] = useState<"" | "sent" | "queued" | "failed">("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = async () => {
    setHolding(false);
    setSending(true);
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    const now = Date.now();
    const duty = ctx.duties.find(
      (d) => new Date(d.starts_at).getTime() <= now + 3600_000 && new Date(d.ends_at).getTime() >= now,
    );
    const site = ctx.sites.find((s) => s.id === duty?.site_id) || ctx.sites[0];
    let pos: Fix | null = null;
    try {
      pos = await getFix({ timeout: 8000, target: 50, max: 5000 });
    } catch {}
    const latitude = pos?.latitude ?? (site?.latitude != null ? Number(site.latitude) : null);
    const longitude = pos?.longitude ?? (site?.longitude != null ? Number(site.longitude) : null);
    if (!site || latitude == null || longitude == null) {
      setSending(false);
      setSent("failed");
      return;
    }
    const payload = {
      title: `SOS · ${ctx.name} (${ctx.code})`,
      description: pos
        ? `Raised from the SDC Guard app. GPS accuracy ±${pos.accuracy} m.`
        : "Raised from the SDC Guard app. GPS unavailable; site location shown.",
    };
    try {
      await api("/api/field/sos", {
        tenant_id: ctx.tenant,
        data: { site_id: site.id, ...payload, latitude, longitude },
      });
      setSent("sent");
    } catch (e) {
      if (transient(e)) {
        await savePending({
          id: crypto.randomUUID(),
          kind: "sos",
          tenant: ctx.tenant,
          employee: ctx.employee,
          site: site.id,
          captured_at: new Date().toISOString(),
          latitude,
          longitude,
          accuracy: pos?.accuracy ?? null,
          ...payload,
        });
        await requestBackgroundSync();
        await onQueued();
        setSent("queued");
      } else {
        onFlash({ tone: "bad", text: (e as Error).message });
        setSent("failed");
      }
    } finally {
      setSending(false);
    }
  };

  const start = () => {
    if (sending) return;
    setHolding(true);
    timer.current = setTimeout(() => void fire(), HOLD);
  };
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  return (
    <>
      <button
        className={`g-sos ${holding ? "is-holding" : ""}`}
        style={{ "--hold": `${HOLD}ms` } as React.CSSProperties}
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !e.repeat) start();
        }}
        onKeyUp={cancel}
        aria-label={t("sosHold")}
        disabled={sending}
      >
        {sending ? <LoaderCircle className="g-spin" size={26} /> : <Siren size={26} />}
        <span>{holding ? t("sosHolding") : "SOS"}</span>
      </button>
      {sent && (
        <div className="g-sheet-backdrop" role="alertdialog" aria-modal="true" aria-label="SOS">
          <div className={`g-sheet g-sos-sheet is-${sent}`}>
            <span className="g-sos-sheet-icon">
              {sent === "sent" ? <CheckCircle2 size={34} /> : <ShieldAlert size={34} />}
            </span>
            <p>{t(sent === "sent" ? "sosSent" : sent === "queued" ? "sosQueued" : "sosFailed")}</p>
            <a className="g-btn g-danger g-block" href="tel:112">
              <Phone size={18} /> {t("call112")}
            </a>
            <button className="g-btn g-outline g-block" onClick={() => setSent("")}>
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Patrol ---------------- */
function PatrolTab({
  ctx,
  t,
  online,
  initialToken,
  onConsumeToken,
  onFlash,
}: {
  ctx: Ctx;
  t: (k: Key, v?: Record<string, string | number>) => string;
  online: boolean;
  initialToken: string | null;
  onConsumeToken: () => void;
  onFlash: (f: Flash) => void;
}) {
  const [rounds, setRounds] = useState<Row[] | null>(null),
    [points, setPoints] = useState<Record<string, Row[]>>({}),
    [scans, setScans] = useState<Record<string, string[]>>({}),
    [scanner, setScanner] = useState(false),
    [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/field/patrols?tenant=${ctx.tenant}`);
      const now = Date.now();
      const mineRows = (d.rows as Row[])
        .filter((r) => r.employee_id === ctx.employee)
        .filter((r) => new Date(r.ends_at).getTime() > now - 2 * 3600_000 && new Date(r.starts_at).getTime() < now + 12 * 3600_000)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
      setRounds(mineRows);
      const sites = [...new Set(mineRows.map((r) => r.site_id as string))];
      const cps = await Promise.all(sites.map((s) => api(`/api/field/checkpoints?tenant=${ctx.tenant}&site=${s}`).then((x) => [s, x.rows] as const)));
      setPoints(Object.fromEntries(cps));
      const sc = await Promise.all(
        mineRows.map((r) =>
          api(`/api/field/scans?tenant=${ctx.tenant}&patrol=${r.id}`).then((x) => [r.id, (x.rows as Row[]).map((s) => s.checkpoint_id)] as const),
        ),
      );
      setScans(Object.fromEntries(sc));
    } catch (e) {
      setRounds((r) => r ?? []);
      if (!transient(e)) onFlash({ tone: "bad", text: (e as Error).message });
    }
  }, [ctx.tenant, ctx.employee, onFlash]);

  useEffect(() => {
    // Fetches this guard's patrol rounds from the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const record = useCallback(
    async (raw: string) => {
      const token = parseToken(raw);
      if (!token) {
        onFlash({ tone: "bad", text: "That QR code is not an SDC checkpoint." });
        return;
      }
      setScanner(false);
      setBusy(true);
      onFlash(null);
      try {
        const fix = await getFix({ target: 25 });
        const now = Date.now();
        const active = (rounds || []).filter((r) => new Date(r.starts_at).getTime() <= now && new Date(r.ends_at).getTime() >= now);
        if (!active.length) throw new Error(t("noRounds"));
        let lastError: unknown = null;
        for (const r of active) {
          try {
            await api("/api/field/scan", { tenant_id: ctx.tenant, patrol_id: r.id, token, ...fix });
            lastError = null;
            break;
          } catch (e) {
            lastError = e;
            if (transient(e)) break;
          }
        }
        if (lastError) throw lastError;
        if ("vibrate" in navigator) navigator.vibrate(80);
        onFlash({ tone: "good", text: t("scanOk") });
        await load();
      } catch (e) {
        const k = (e as Error).message;
        onFlash({ tone: "bad", text: ["gpsWeak", "gpsDenied", "gpsUnavailable"].includes(k) ? t(k as Key) : transient(e) ? t("needsSignal") : k });
      } finally {
        setBusy(false);
      }
    },
    [rounds, ctx.tenant, t, load, onFlash],
  );

  useEffect(() => {
    if (initialToken && rounds) {
      onConsumeToken();
      // A scanned checkpoint link is an external event to act on once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void record(initialToken);
    }
  }, [initialToken, rounds, record, onConsumeToken]);

  return (
    <div className="g-stack">
      <div className="g-row-between">
        <h1 className="g-h1">{t("patrolRounds")}</h1>
        <button className="g-icon-btn" aria-label={t("retry")} onClick={() => void load()}>
          <RefreshCw size={18} />
        </button>
      </div>
      <button className="g-hero g-hero-scan" disabled={busy || !online} onClick={() => setScanner(true)}>
        {busy ? <LoaderCircle className="g-spin" size={26} /> : <ScanLine size={26} />}
        <span>{busy ? t("locating") : t("scanCheckpoint")}</span>
      </button>
      {rounds === null ? (
        <span className="g-skeleton" style={{ height: 140 }} />
      ) : rounds.length === 0 ? (
        <div className="g-empty">
          <Route size={30} />
          <p>{t("noRounds")}</p>
        </div>
      ) : (
        rounds.map((r) => {
          const list = (points[r.site_id] || []).filter((c) => (r.checkpoint_ids as string[]).includes(c.id));
          const done = new Set(scans[r.id] || []);
          const count = (r.checkpoint_ids as string[]).filter((id) => done.has(id)).length;
          const total = (r.checkpoint_ids as string[]).length;
          return (
            <section className="g-card" key={r.id}>
              <div className="g-row-between">
                <div>
                  <h2>{r.title}</h2>
                  <small className="g-muted">
                    {istTime(r.starts_at)} – {istTime(r.ends_at)}
                  </small>
                </div>
                <span className={`g-pill ${count === total ? "g-pill-good" : ""}`}>
                  {count}/{total}
                </span>
              </div>
              <div className="g-progress">
                <span style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
              </div>
              <ul className="g-list">
                {list.map((c) => (
                  <li key={c.id} className={done.has(c.id) ? "is-done" : ""}>
                    <span className="g-list-icon">{done.has(c.id) ? <Check size={18} /> : <QrCode size={18} />}</span>
                    <div>
                      <strong>{c.title}</strong>
                      <small>
                        {done.has(c.id) ? t("scanned") : t("notScanned")}
                        {c.location ? ` · ${c.location}` : ""}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
      {scanner && <Scanner t={t} onResult={(v) => void record(v)} onClose={() => setScanner(false)} />}
    </div>
  );
}

function parseToken(raw: string) {
  const v = raw.trim();
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  try {
    const u = new URL(v);
    const c = u.searchParams.get("checkpoint");
    if (c && uuid.test(c)) return c.match(uuid)![0];
  } catch {}
  return v.match(uuid)?.[0] || null;
}

type Detector = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };
function Scanner({ t, onResult, onClose }: { t: (k: Key) => string; onResult: (v: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [manual, setManual] = useState(""),
    [camera, setCamera] = useState<"starting" | "on" | "off">("starting");
  useEffect(() => {
    let stream: MediaStream | null = null,
      timer: ReturnType<typeof setInterval> | undefined,
      stopped = false;
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    (async () => {
      if (!BD || !navigator.mediaDevices?.getUserMedia) return setCamera("off");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped) return stream.getTracks().forEach((x) => x.stop());
        video.current!.srcObject = stream;
        await video.current!.play();
        setCamera("on");
        const detector = new BD({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          try {
            const codes = await detector.detect(video.current!);
            if (codes[0]?.rawValue) {
              clearInterval(timer);
              onResult(codes[0].rawValue);
            }
          } catch {}
        }, 350);
      } catch {
        setCamera("off");
      }
    })();
    return () => {
      stopped = true;
      clearInterval(timer);
      stream?.getTracks().forEach((x) => x.stop());
    };
  }, [onResult]);
  return (
    <div className="g-sheet-backdrop" role="dialog" aria-modal="true" aria-label={t("scanCheckpoint")}>
      <div className="g-sheet">
        <div className="g-row-between">
          <h2>{t("scanCheckpoint")}</h2>
          <button className="g-icon-btn" aria-label={t("close")} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {camera !== "off" ? (
          <div className="g-viewfinder">
            <video ref={video} playsInline muted />
            <span className="g-reticle" />
            <p>{t("pointCamera")}</p>
          </div>
        ) : (
          <p className="g-muted">{t("cameraBlocked")}</p>
        )}
        <form
          className="g-manual"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) onResult(manual);
          }}
        >
          <label>
            {t("enterCode")}
            <input value={manual} onChange={(e) => setManual(e.target.value)} autoCapitalize="off" autoComplete="off" spellCheck={false} />
          </label>
          <button className="g-btn g-primary" disabled={!manual.trim()}>
            {t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Report ---------------- */
const categories = [
  ["theft", PackageX],
  ["trespass", DoorOpen],
  ["fire", Flame],
  ["medical", HeartPulse],
  ["damage", Hammer],
  ["suspicious", Eye],
  ["other", CircleHelp],
] as const;
function ReportTab({
  ctx,
  t,
  online,
  onFlash,
}: {
  ctx: Ctx;
  t: (k: Key, v?: Record<string, string | number>) => string;
  online: boolean;
  onFlash: (f: Flash) => void;
}) {
  const now = useNow();
  const duty = ctx.duties.find((d) => new Date(d.starts_at).getTime() <= now + 3600_000 && new Date(d.ends_at).getTime() >= now);
  const [category, setCategory] = useState<(typeof categories)[number][0] | "">(""),
    [severity, setSeverity] = useState("medium"),
    [details, setDetails] = useState(""),
    [site, setSite] = useState<string>(duty?.site_id || ctx.sites[0]?.id || ""),
    [photo, setPhoto] = useState<Blob | null>(null),
    [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const siteName = ctx.sites.find((s) => s.id === site)?.name || "";
  const ready = category && details.trim().length >= 5 && site && online && !busy;

  const send = async () => {
    setBusy(true);
    onFlash(null);
    try {
      const label = translate("en", category as Key);
      const d = await api("/api/field/incidents", {
        tenant_id: ctx.tenant,
        data: {
          site_id: site,
          title: `${label} reported at ${siteName}`,
          category: label,
          severity,
          description: details.trim(),
          occurred_at: new Date().toISOString(),
          post_id: duty?.site_id === site ? duty.post_id ?? null : null,
          employee_id: ctx.employee,
          sop_checklist: {},
          investigation: "",
          resolution: "",
        },
      });
      if (photo && d.record?.id) {
        const f = new FormData();
        f.set("tenant", ctx.tenant);
        f.set("site", site);
        f.set("entity", d.record.id);
        f.set("kind", "incidents");
        f.set("file", photo, "incident.jpg");
        await api("/api/field-evidence", f).catch(() => {});
      }
      setCategory("");
      setDetails("");
      setPhoto(null);
      setSeverity("medium");
      onFlash({ tone: "good", text: t("reportSent") });
    } catch (e) {
      onFlash({ tone: "bad", text: transient(e) ? t("needsSignal") : (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="g-stack">
      <h1 className="g-h1">{t("reportIncident")}</h1>
      {ctx.sites.length > 1 && (
        <label className="g-field">
          {t("site")}
          <select value={site} onChange={(e) => setSite(e.target.value)}>
            {ctx.sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset className="g-field">
        <legend>{t("whatHappened")}</legend>
        <div className="g-cats">
          {categories.map(([k, Icon]) => (
            <button key={k} type="button" aria-pressed={category === k} onClick={() => setCategory(k)}>
              <Icon size={22} />
              <span>{t(k)}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="g-field">
        <legend>{t("severity")}</legend>
        <div className="g-seg">
          {(["low", "medium", "high", "critical"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={severity === s} className={`sev-${s}`} onClick={() => setSeverity(s)}>
              {t(s)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="g-field">
        {t("details")}
        <textarea rows={4} value={details} placeholder={t("detailsHint")} maxLength={2000} onChange={(e) => setDetails(e.target.value)} />
      </label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setPhoto(await compress(f, 1280, 0.75));
        }}
      />
      <button className="g-btn g-outline g-block" type="button" onClick={() => fileRef.current?.click()}>
        <Camera size={18} /> {photo ? `${t("addPhoto")} ✓` : t("addPhoto")}
      </button>
      <button className="g-hero" disabled={!ready} onClick={() => void send()}>
        {busy ? <LoaderCircle className="g-spin" size={24} /> : <AlertTriangle size={24} />}
        <span>{t("sendReport")}</span>
      </button>
      {!online && <p className="g-muted g-center">{t("needsSignal")}</p>}
    </div>
  );
}

/* ---------------- More ---------------- */
function MoreTab({
  t,
  lang,
  onLang,
  pendingCount,
}: {
  t: (k: Key, v?: Record<string, string | number>) => string;
  lang: Lang;
  onLang: (l: Lang) => void;
  pendingCount: number;
}) {
  const [out, setOut] = useState(false);
  return (
    <div className="g-stack">
      <section className="g-card g-menu">
        {(
          [
            ["/deployment", CalendarDays, "myRoster"],
            ["/employees", User, "myProfile"],
            ["/training", GraduationCap, "training"],
          ] as const
        ).map(([href, Icon, k]) => (
          <a key={href} href={href}>
            <Icon size={20} />
            <span>{t(k)}</span>
            <ChevronRight size={18} />
          </a>
        ))}
      </section>
      <section className="g-card">
        <h2 className="g-with-icon">
          <Languages size={18} /> {t("language")}
        </h2>
        <div className="g-seg">
          {languages.map((l) => (
            <button key={l.code} aria-pressed={lang === l.code} onClick={() => onLang(l.code)}>
              {l.label}
            </button>
          ))}
        </div>
      </section>
      <button
        className="g-btn g-outline g-block"
        disabled={out}
        onClick={async () => {
          if (pendingCount && !confirm(t("signOutPending", { n: pendingCount }))) return;
          setOut(true);
          try {
            await fetch("/api/auth/logout", { method: "POST" });
          } catch {}
          try {
            localStorage.removeItem(CTX_KEY);
          } catch {}
          window.location.assign("/login?next=/attendance");
        }}
      >
        <LogOut size={18} /> {t("signOut")}
      </button>
    </div>
  );
}
