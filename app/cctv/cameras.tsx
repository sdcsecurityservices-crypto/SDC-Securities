"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiveVideo } from "@/components/operations/live-video";
import {
  Camera,
  Play,
  Plus,
  ShieldCheck,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  OperationsShell,
  useWorkspace,
  request,
  dateLabel,
} from "@/components/operations/shell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// Schema-driven forms consume records validated by the resource-specific Zod API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export default function Cameras() {
  return (
    <OperationsShell
      title="Camera operations"
      subtitle="Authorised visibility. Accountable access. Every view recorded."
    >
      <Wall />
    </OperationsShell>
  );
}
function Wall() {
  const m = useWorkspace(),
    t = m.tenant_id,
    editAllowed = ["admin", "operations_manager", "senior_manager"].includes(
      m.role,
    );
  const [site, setSite] = useState(""),
    [sites, setSites] = useState<Row[]>([]),
    [tab, setTab] = useState("cameras"),
    [rows, setRows] = useState<Row[]>([]),
    [consents, setConsents] = useState<Row[]>([]),
    [posts, setPosts] = useState<Row[]>([]),
    [documents, setDocuments] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [edit, setEdit] = useState<Row | null>(null),
    [form, setForm] = useState<Row>({}),
    [busy, setBusy] = useState(false),
    [views, setViews] = useState<Record<string, Row>>({}),
    [reason, setReason] = useState("Scheduled site security monitoring"),
    [offset, setOffset] = useState(0),
    [total, setTotal] = useState(0);
  const load = useCallback(async () => {
    if (!site) return;
    try {
      const d = await request(
        `/api/cctv/${tab}?tenant=${t}&site=${site}&offset=${offset}`,
      );
      setRows(d.rows);
      setTotal(d.total);
      const c = await request(`/api/cctv/consents?tenant=${t}&site=${site}`);
      setConsents(c.rows);
      const p = await request(`/api/cctv/posts?tenant=${t}&site=${site}`);
      setPosts(p.rows);
      const clientId = sites.find((s) => s.id === site)?.client_id;
      if (clientId) {
        const docs = await request(
          `/api/foundation-files?tenant=${t}&client=${clientId}&site=${site}`,
        );
        setDocuments(docs.rows);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [t, site, tab, offset, sites]);
  useEffect(() => {
    request(`/api/field/context?tenant=${t}`)
      .then((d) => {
        setSites(d.sites);
        setSite(d.sites[0]?.id || "");
      })
      .catch((e) => setError(e.message));
  }, [t]);
  useEffect(() => {
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  const open = (r?: Row) => {
    setEdit(r || {});
    setForm(
      tab === "consents"
        ? {
            title: "",
            authorized_cameras: [],
            permitted_roles: ["admin", "operations_manager"],
            purpose: "Site security monitoring",
            starts_on: new Date().toISOString().slice(0, 10),
            ends_on: "",
            hour_from: 0,
            hour_to: 24,
            signed_document_id: "",
            allow_recording: false,
            ...r,
          }
        : {
            title: "",
            consent_id: "",
            location: "",
            stream_type: "mock",
            source: "",
            post_ids: [],
            field_of_view: "",
            status: "online",
            ...r,
          },
    );
  };
  const save = async () => {
    setBusy(true);
    try {
      const keys =
        tab === "consents"
          ? [
              "title",
              "authorized_cameras",
              "permitted_roles",
              "purpose",
              "starts_on",
              "ends_on",
              "hour_from",
              "hour_to",
              "signed_document_id",
              "allow_recording",
            ]
          : [
              "title",
              "consent_id",
              "location",
              "stream_type",
              "source",
              "post_ids",
              "field_of_view",
              "status",
            ];
      await request("/api/cctv/" + tab, {
        tenant_id: t,
        id: edit?.id,
        row_version: edit?.row_version,
        data: {
          ...Object.fromEntries(keys.map((k) => [k, form[k]])),
          site_id: site,
        },
      });
      setEdit(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const view = async (c: Row) => {
    try {
      const d = await request("/api/cctv/view", {
        tenant_id: t,
        camera_id: c.id,
        reason,
      });
      setViews((v) => ({ ...v, [c.id]: { ...d, camera_id: c.id } }));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const close = async (id: string) => {
    const s = views[id];
    setViews((v) => {
      const n = { ...v };
      delete n[id];
      return n;
    });
    if (s)
      await request("/api/cctv/view", {
        tenant_id: t,
        camera_id: id,
        session_id: s.session_id,
        close: true,
        reason: "",
      }).catch(() => {});
  };
  return (
    <>
      <div className="ops-toolbar">
        <select
          value={site}
          aria-label="Site"
          onChange={(e) => {
            Object.keys(views).forEach((id) => void close(id));
            setSite(e.target.value);
          }}
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="ops-badge">
          <ShieldCheck size={14} style={{ display: "inline" }} />
          Written consent required
        </span>
      </div>
      <div className="ops-tabs">
        {[
          ["cameras", "Camera wall"],
          ["consents", "Written authorisations"],
          ["access_log", "Viewing history"],
        ].map(([k, l]) => (
          <button
            aria-selected={tab === k}
            key={k}
            onClick={() => {
              setTab(k);
              setOffset(0);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {error && !edit && (
        <p role="alert" className="ops-error">
          {error}
        </p>
      )}
      <div className="ops-toolbar">
        {tab === "cameras" ? (
          <label>
            Viewing purpose{" "}
            <input
              aria-label="Viewing purpose"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        ) : (
          <p>Each authorisation is linked to a signed client document.</p>
        )}
        {editAllowed && tab !== "access_log" && (
          <button className="ops-button" onClick={() => open()}>
            <Plus size={17} />
            Add {tab === "cameras" ? "camera" : "consent"}
          </button>
        )}
      </div>
      {tab === "cameras" ? (
        <div className="ops-grid">
          {rows.map((c) => (
            <article
              className="ops-card"
              style={{ padding: 0, overflow: "hidden" }}
              key={c.id}
            >
              {views[c.id] ? (
                <Feed
                  tenant={t}
                  camera={c}
                  session={views[c.id]}
                  onClose={() => void close(c.id)}
                  onError={(msg) => {
                    setError(msg);
                    void close(c.id);
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 190,
                    background: "#102b47",
                    color: "#c4d3e2",
                    display: "grid",
                    placeContent: "center",
                    textAlign: "center",
                    gap: 12,
                  }}
                >
                  <Camera size={35} style={{ margin: "auto" }} />
                  <span>
                    {c.stream_type === "mock"
                      ? "DEMONSTRATION CAMERA"
                      : "LIVE VIEW REQUIRES AUTHORISATION"}
                  </span>
                </div>
              )}
              <div style={{ padding: 22 }}>
                <span
                  className={`ops-badge ${c.status === "online" ? "good" : "warn"}`}
                >
                  {c.status}
                </span>
                <h3>{c.title}</h3>
                <p>{c.location}</p>
                {posts
                  .filter((p) => c.post_ids.includes(p.id))
                  .map((p) => (
                    <p key={p.id}>
                      <strong>{p.name}</strong>:{" "}
                      {p.guards.length
                        ? p.guards
                            .map(
                              (g: Row) =>
                                `${g.name} · ${g.checked_in ? "Checked in" : "Awaiting check-in"}`,
                            )
                            .join(", ")
                        : "No active published duty"}
                    </p>
                  ))}
                <footer>
                  {!views[c.id] && (
                    <button className="ops-button" onClick={() => void view(c)}>
                      <Play size={15} />
                      View camera
                    </button>
                  )}
                  <a
                    href={`/operations?view=incidents&site=${site}&camera=${encodeURIComponent(c.title)}`}
                    className="ops-button secondary"
                  >
                    <AlertTriangle size={15} />
                    Report incident
                  </a>
                  {editAllowed && (
                    <button
                      className="ops-button secondary"
                      onClick={() => open(c)}
                    >
                      Edit
                    </button>
                  )}
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : tab === "consents" ? (
        <div className="ops-grid">
          {rows.map((c) => (
            <article className="ops-card" key={c.id}>
              <span className={`ops-badge ${c.revoked_at ? "bad" : "good"}`}>
                {c.revoked_at ? "Revoked" : "On record"}
              </span>
              <h3>{c.title}</h3>
              <p>{c.purpose}</p>
              <p>
                {dateLabel(c.starts_on)} – {dateLabel(c.ends_on)}
                <br />
                {c.hour_from}:00–{c.hour_to}:00 IST
              </p>
              <small>
                Cameras: {c.authorized_cameras.join(", ")}
                <br />
                Roles: {c.permitted_roles.join(", ")}
              </small>
              {editAllowed && (
                <footer>
                  <button
                    className="ops-button secondary"
                    onClick={() => open(c)}
                  >
                    Edit
                  </button>
                  {!c.revoked_at && (
                    <button
                      className="ops-button secondary"
                      onClick={async () => {
                        try {
                          await request("/api/cctv/revoke", {
                            tenant_id: t,
                            id: c.id,
                            row_version: c.row_version,
                          });
                          await load();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Revoke access
                    </button>
                  )}
                </footer>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Viewer</th>
                <th>Reason</th>
                <th>Started</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.viewer_name}</td>
                  <td>{r.reason}</td>
                  <td>
                    {new Date(r.started_at).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </td>
                  <td>
                    {Math.max(
                      0,
                      Math.round(
                        (new Date(r.ended_at || r.last_seen_at).getTime() -
                          new Date(r.started_at).getTime()) /
                          1000,
                      ),
                    )}{" "}
                    seconds
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!rows.length && (
        <div className="ops-empty">
          No {tab.replaceAll("_", " ")} registered for this site.
        </div>
      )}
      <div className="ops-toolbar">
        <button
          className="ops-button secondary"
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          Previous
        </button>
        <span>Page {offset / 50 + 1}</span>
        <button
          className="ops-button secondary"
          disabled={offset + 50 >= total}
          onClick={() => setOffset(offset + 50)}
        >
          Next
        </button>
      </div>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent style={{ maxWidth: 700 }}>
          <DialogHeader>
            <DialogTitle>
              {edit?.id ? "Edit" : "Add"}{" "}
              {tab === "cameras" ? "camera" : "written consent"}
            </DialogTitle>
            <DialogDescription>
              {tab === "consents"
                ? "Upload the signed client authorisation under Clients & sites → Documents first."
                : "Camera names must match the written authorisation. Source addresses are encrypted and never sent to viewers."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="ops-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            {(tab === "consents"
              ? [
                  "title",
                  "authorized_cameras",
                  "permitted_roles",
                  "purpose",
                  "starts_on",
                  "ends_on",
                  "hour_from",
                  "hour_to",
                  "signed_document_id",
                ]
              : [
                  "title",
                  "consent_id",
                  "location",
                  "stream_type",
                  "source",
                  "post_ids",
                  "field_of_view",
                  "status",
                ]
            ).map((k) => (
              <label
                key={k}
                className={
                  [
                    "purpose",
                    "source",
                    "field_of_view",
                    "authorized_cameras",
                    "permitted_roles",
                  ].includes(k)
                    ? "wide"
                    : ""
                }
              >
                {k.replaceAll("_", " ")}
                {k === "signed_document_id" ? (
                  <select
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  >
                    <option value="">Choose uploaded signed document</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.file_name}
                      </option>
                    ))}
                  </select>
                ) : k === "post_ids" ? (
                  <select
                    multiple
                    value={form[k]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [k]: Array.from(
                          e.target.selectedOptions,
                          (o) => o.value,
                        ),
                      })
                    }
                  >
                    {posts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : k === "consent_id" ? (
                  <select
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  >
                    <option value="">Choose authorisation</option>
                    {consents
                      .filter((c) => !c.revoked_at)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                  </select>
                ) : ["stream_type", "status"].includes(k) ? (
                  <select
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  >
                    {(k === "stream_type"
                      ? ["mock", "rtsp", "onvif", "hls", "vendor"]
                      : ["online", "offline", "maintenance"]
                    ).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      k.endsWith("_on")
                        ? "date"
                        : k.startsWith("hour_")
                          ? "number"
                          : k === "source"
                            ? "password"
                            : "text"
                    }
                    autoComplete="off"
                    value={
                      Array.isArray(form[k])
                        ? form[k].join(",")
                        : (form[k] ?? "")
                    }
                    placeholder={
                      [
                        "post_ids",
                        "authorized_cameras",
                        "permitted_roles",
                      ].includes(k)
                        ? "Comma separated values"
                        : k === "source" && edit?.id
                          ? "Leave blank to keep current source"
                          : ""
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [k]: [
                          "post_ids",
                          "authorized_cameras",
                          "permitted_roles",
                        ].includes(k)
                          ? e.target.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean)
                          : k.startsWith("hour_")
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            {error && <p className="ops-error wide">{error}</p>}
            <div className="ops-form-actions">
              <button
                type="button"
                className="ops-button secondary"
                onClick={() => setEdit(null)}
              >
                Cancel
              </button>
              <button className="ops-button" disabled={busy}>
                Save record
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
function Feed({
  tenant,
  camera,
  session,
  onClose,
  onError,
}: {
  tenant: string;
  camera: Row;
  session: Row;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [now, setNow] = useState(() => Date.now()),
    [playback, setPlayback] = useState(session.playback_url as string),
    expires = useRef(new Date(session.expires_at).getTime());
  const errorRef = useRef(onError);
  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    let active = true;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= expires.current) {
        errorRef.current(
          "Camera authorisation expired. Open a new authorised view.",
        );
      }
    }, 500);
    const heartbeat = setInterval(() => {
      fetch("/api/cctv/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          tenant_id: tenant,
          camera_id: camera.id,
          session_id: session.session_id,
          reason: "Session renewal",
        }),
      })
        .then(async (r) => {
          const d = (await r.json()) as {
            error?: string;
            expires_at: string;
            playback_url: string;
          };
          if (!r.ok) throw Error(d.error || "Camera authorisation ended");
          if (active) {
            expires.current = new Date(d.expires_at).getTime();
            setPlayback(d.playback_url);
          }
        })
        .catch((e) => {
          if (active) errorRef.current(e.message);
        });
    }, 20000);
    return () => {
      active = false;
      clearInterval(timer);
      clearInterval(heartbeat);
      void request("/api/cctv/view", {
        tenant_id: tenant,
        camera_id: camera.id,
        session_id: session.session_id,
        close: true,
        reason: "",
      }).catch(() => {});
    };
  }, [tenant, camera.id, session.session_id]);
  useEffect(() => {
    const c = canvas.current,
      ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.fillStyle = "#19344a";
    ctx.fillRect(0, 0, 640, 360);
    ctx.strokeStyle = "#416079";
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 360);
      ctx.stroke();
    }
    for (let y = 100; y < 360; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#294a63";
    ctx.fillRect(140, 130, 350, 170);
    ctx.fillStyle = "#93aabd";
    ctx.fillRect(240, 170, 90, 130);
    ctx.fillStyle = "#ebc751";
    ctx.fillRect(100 + (Math.floor(now / 1000) % 35) * 10, 270, 18, 32);
    ctx.fillStyle = "#cee0ee";
    ctx.font = "14px sans-serif";
    ctx.fillText("SYNTHETIC DEMO · NO LIVE FOOTAGE", 18, 85);
  }, [now]);
  return (
    <div
      style={{ position: "relative", background: "#102b47", color: "white" }}
    >
      {session.mode === "mock" ? (
        <canvas
          ref={canvas}
          width={640}
          height={360}
          role="img"
          aria-label="Animated synthetic demonstration camera, not live footage"
          style={{ width: "100%", display: "block" }}
        />
      ) : (
        <LiveVideo url={playback} onError={onError} />
      )}
      <div
        style={{
          position: "absolute",
          inset: "12px 12px auto",
          fontSize: 12,
          background: "#061a35bb",
          padding: 8,
          pointerEvents: "none",
        }}
      >
        {session.viewer} ·{" "}
        {new Date(now).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}{" "}
        IST
        <br />
        {camera.title} ·{" "}
        {session.mode === "mock"
          ? "SYNTHETIC DEMONSTRATION"
          : "AUTHORISED LIVE VIEW ONLY"}
      </div>
      <button
        aria-label="Close camera view"
        onClick={onClose}
        style={{
          position: "absolute",
          right: 8,
          bottom: 8,
          background: "#092543",
          color: "white",
          padding: 7,
          border: "1px solid #9bb1c6",
          borderRadius: 5,
        }}
      >
        <X size={17} />
      </button>
    </div>
  );
}
