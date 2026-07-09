"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/Toast";
import { UserMinus, ChevronLeft, Users } from "lucide-react";
import Link from "next/link";

export default function AdminEventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const { show, ToastComponent } = useToast();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== "admin") router.replace("/login");
      else setAuthChecked(true);
    });
  }, []);

  const load = useCallback(async () => {
    const [evRes, allRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch("/api/members"),
    ]);
    const evData = await evRes.json();
    const allData = await allRes.json();
    setEvent(evData.event);
    setMembers(evData.members || []);
    setAllMembers(allData.members || []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (uid: number) => {
    const res = await fetch(`/api/events/${id}/members/${uid}`, { method: "DELETE" });
    if (res.ok) { show("Member removed from event", "success"); load(); }
    else show("Remove failed", "error");
  };

  if (!authChecked) return null;

  if (!event) return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="admin" />
        <main style={{ flex: 1, padding: 32, color: "var(--color-gov-muted)" }}>Loading…</main>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="admin" />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <Link href="/admin/events" style={{ display: "inline-flex", alignItems: "center", gap: 6,
            color: "var(--color-gov-muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: 20 }}>
            <ChevronLeft size={15} /> Back to Events
          </Link>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 4 }}>{event.title}</h1>
            <div style={{ display: "flex", gap: 16, fontSize: "0.8125rem", color: "var(--color-gov-muted)" }}>
              <span className={`badge badge-${event.status}`}>{event.status}</span>
              <span>{members.length} member{members.length !== 1 ? "s" : ""} assigned</span>
            </div>
          </div>

          {/* Current members */}
          <div className="gov-card">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-gov-border)" }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Assigned Members ({members.length})</h2>
            </div>
            {members.length === 0 ? (
              <div className="empty-state">
                <Users size={28} style={{ margin: "0 auto 10px", opacity: 0.25 }} />
                <p>No members assigned yet</p>
              </div>
            ) : (
              <table className="gov-table">
                <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Action</th></tr></thead>
                <tbody>
                  {members.map((m: any) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.name}</td>
                      <td style={{ color: "var(--color-gov-muted)" }}>{m.email}</td>
                      <td style={{ color: "var(--color-gov-muted)" }}>{m.department || "—"}</td>
                      <td>
                        <button className="btn-danger btn-sm" onClick={() => handleRemove(m.id)}>
                          <UserMinus size={13} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
      {ToastComponent}
    </>
  );
}
