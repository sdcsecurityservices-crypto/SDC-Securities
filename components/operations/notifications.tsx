"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { request } from "./shell";
type Notice = {
  id: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};
export function Notifications({ tenant }: { tenant: string }) {
  const [rows, setRows] = useState<Notice[]>([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!tenant) return;
    let active = true;
    const load = () =>
      request(`/api/roster/notifications?tenant=${tenant}`)
        .then((d) => {
          if (active) setRows(d.rows);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tenant]);
  return (
    <>
      <button
        className="ops-button secondary"
        aria-label={`Notifications, ${rows.filter((n) => !n.read_at).length} unread`}
        onClick={() => setOpen(true)}
      >
        <Bell size={19} />
        <span>{rows.filter((n) => !n.read_at).length}</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent style={{ overflowY: "auto", padding: 24 }}>
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              Your latest 50 workspace alerts. Updated every 30 seconds.
            </SheetDescription>
          </SheetHeader>
          {error && <p role="alert">{error}</p>}
          {rows.map((n) => (
            <article
              key={n.id}
              style={{ padding: "20px 0", borderBottom: "1px solid #cbd5e1" }}
            >
              <strong>
                {n.title}
                {!n.read_at && " · New"}
              </strong>
              <p style={{ margin: "8px 0", fontSize: 15 }}>{n.body}</p>
              <small>
                {new Date(n.created_at).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </small>
              <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
                <a
                  href={
                    n.href?.startsWith("/") && !n.href.startsWith("//")
                      ? n.href
                      : "/control"
                  }
                >
                  Open record →
                </a>
                {!n.read_at && (
                  <button
                    onClick={async () => {
                      try {
                        await request("/api/roster/notification_read", {
                          tenant_id: tenant,
                          id: n.id,
                        });
                        setRows((r) =>
                          r.map((x) =>
                            x.id === n.id
                              ? { ...x, read_at: new Date().toISOString() }
                              : x,
                          ),
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
          {!rows.length && (
            <p style={{ marginTop: 30 }}>
              You’re up to date. New alerts will appear here.
            </p>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
