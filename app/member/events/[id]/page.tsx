"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/Toast";
import { ChevronLeft, Upload, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function MemberEventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState("0");
  const { show, ToastComponent } = useToast();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || (d.user.role !== "member" && d.user.role !== "admin")) router.replace("/login");
      else setAuthChecked(true);
    });
  }, []);

  const load = useCallback(async () => {
    const evRes = await fetch(`/api/events/${id}`);
    const evData = await evRes.json();
    setEvent(evData.event);
    if (evData.event) {
      setParticipantCount(evData.event.participant_count !== null ? String(evData.event.participant_count) : "0");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSaveCount = async () => {
    const count = parseInt(participantCount);
    if (isNaN(count) || count < 0) {
      show("Please enter a valid non-negative number", "error");
      return;
    }
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_count: count }),
    });
    if (res.ok) {
      show("Participant count updated successfully", "success");
      load();
    } else {
      const d = await res.json();
      show(d.error || "Failed to update participant count", "error");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const confirmMessage = newStatus === "closed"
      ? `Are you sure you want to end "${event.title}"? Members will no longer be able to upload images.`
      : `Reopen "${event.title}"?`;
    if (!confirm(confirmMessage)) return;

    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      show(newStatus === "closed" ? "Event ended successfully" : "Event reopened", "success");
      load();
    } else {
      show("Failed to update status", "error");
    }
  };

  if (!authChecked) return null;

  if (!event) return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="member" />
        <main style={{ flex: 1, padding: 32, color: "var(--color-gov-muted)" }}>Loading…</main>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="member" />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <Link href="/member/events" style={{ display: "inline-flex", alignItems: "center", gap: 6,
            color: "var(--color-gov-muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: 20 }}>
            <ChevronLeft size={15} /> Back to My Events
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>{event.title}</h1>
                {event.department && (
                  <span style={{
                    padding: "2px 10px",
                    background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: 999, fontSize: "0.75rem", color: "var(--color-gov-gold)",
                  }}>
                    {event.department}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge badge-${event.status}`}>{event.status}</span>
                <span className="badge badge-outline" style={{ fontSize: "0.75rem", background: "rgba(0,0,0,0.03)" }}>
                  {event.type === 'sub' ? 'Sub-Event' : 'Main Event'}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {event.status === "active" ? (
                <>
                  <Link href={`/member/upload?eventId=${event.id}`} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Upload size={15} /> Upload Images
                  </Link>
                  <button onClick={() => handleStatusChange("closed")} className="btn-danger" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <XCircle size={15} /> End Event
                  </button>
                </>
              ) : (
                <button onClick={() => handleStatusChange("active")} className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-gov-success, #22c55e)", borderColor: "var(--color-gov-success, #22c55e)" }}>
                  <CheckCircle size={15} /> Reopen Event
                </button>
              )}
            </div>
          </div>

          <div className="gov-card" style={{ padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: 6 }}>
              Total Participant Count (Numerical)
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-gov-muted)", marginBottom: 14 }}>
              Instead of registering users one-by-one, specify a total number of participants (e.g. for events with hundreds or thousands of attendees) to show on the public pages.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={participantCount}
                onChange={(e) => setParticipantCount(e.target.value)}
                className="form-input"
                style={{ maxWidth: 200 }}
              />
              <button className="btn-primary" onClick={handleSaveCount}>
                Save Count
              </button>
            </div>
          </div>
        </main>
      </div>
      {ToastComponent}
    </>
  );
}
