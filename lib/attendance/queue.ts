export type PendingAttendance = {
  id: string;
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
};
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("sdc-attendance", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("pending", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function queued() {
  const d = await database();
  return new Promise<PendingAttendance[]>((resolve, reject) => {
    const tx = d.transaction("pending", "readonly"),
      r = tx.objectStore("pending").getAll();
    r.onsuccess = () =>
      resolve(
        (r.result as PendingAttendance[]).sort((a, b) =>
          a.captured_at.localeCompare(b.captured_at),
        ),
      );
    r.onerror = () => reject(r.error);
    tx.oncomplete = () => d.close();
  });
}
export async function savePending(event: PendingAttendance) {
  const d = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction("pending", "readwrite");
    tx.objectStore("pending").put(event);
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
export async function removePending(id: string) {
  const d = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction("pending", "readwrite");
    tx.objectStore("pending").delete(id);
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
