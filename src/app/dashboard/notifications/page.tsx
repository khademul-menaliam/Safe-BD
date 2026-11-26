"use client";
import { useEffect, useState } from "react";

type Notification = { id: string; type: string; title: string; body: string; isRead: boolean; createdAt: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifications");
    if (res.ok) setItems((await res.json()).notifications);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">Notifications</h1>
      <div className="card mt-6">
        {loading ? <p className="text-sm text-gray-500">Loading…</p> : items.length === 0 ? <p className="text-sm text-gray-500">No notifications yet.</p> : (
          <div className="divide-y divide-navy-900/5">
            {items.map((n) => (
              <div key={n.id} className={`flex items-start justify-between gap-4 py-3 ${n.isRead ? "opacity-60" : ""}`}>
                <div>
                  <div className="font-medium text-navy-950">{n.title}</div>
                  <div className="text-sm text-gray-600">{n.body}</div>
                  <div className="mt-0.5 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.isRead && <button onClick={() => markRead(n.id)} className="text-xs font-semibold text-navy-800 underline whitespace-nowrap">Mark read</button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
