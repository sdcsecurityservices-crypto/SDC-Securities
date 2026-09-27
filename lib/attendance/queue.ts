// On-device outbox for guard actions captured without a connection.
export type PendingAttendance = {
  id: string;
  kind?: "attendance";
  tenant: string;
  employee: string;
  site: string;
  action: "check_in" | "check_out";
  captured_at: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  photo?: Blob;
  document_id?: string;
  error?: string;
  /** Permanent server rejection: kept for the guard to review, not retried. */
  failed?: boolean;
};
export type PendingSos = {
  id: string;
  kind: "sos";
  tenant: string;
  employee: string;
  site: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  title: string;
  description: string;
  error?: string;
  failed?: boolean;
};
export type Pending = PendingAttendance | PendingSos;

async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("sdc-attendance", 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains("pending"))
        r.result.createObjectStore("pending", { keyPath: "id" });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function queued() {
  const d = await database();
  return new Promise<Pending[]>((resolve, reject) => {
    const tx = d.transaction("pending", "readonly"),
      r = tx.objectStore("pending").getAll();
    r.onsuccess = () =>
      resolve((r.result as Pending[]).sort((a, b) => a.captured_at.localeCompare(b.captured_at)));
    r.onerror = () => reject(r.error);
    tx.oncomplete = () => d.close();
  });
}
async function write(fn: (store: IDBObjectStore) => void) {
  const d = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction("pending", "readwrite");
    fn(tx.objectStore("pending"));
    tx.oncomplete = () => {
      d.close();
      resolve();
    };
    tx.onerror = () => {
      d.close();
      reject(tx.error);
    };
  });
}
export const savePending = (event: Pending) => write((s) => s.put(event));
export const removePending = (id: string) => write((s) => s.delete(id));
/** Update an entry only if it is still queued (another sync may have sent it). */
export async function updateIfQueued(id: string, patch: Partial<Pending>) {
  const current = (await queued()).find((e) => e.id === id);
  if (current) await savePending({ ...current, ...patch } as Pending);
}
export async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    await (reg as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } })?.sync?.register("sdc-outbox");
  } catch {}
}
