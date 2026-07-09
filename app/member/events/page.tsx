"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/Toast";
import { Calendar, Upload, XCircle, CheckCircle, Users, PlusCircle, ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react";
import EventFormModal from "@/components/EventFormModal";
import Link from "next/link";

interface Event {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  location: string;
  department?: string;
  type: string;
  status: string;
  parent_id?: number;
  created_at: string;
  image_count: number;
  participant_count?: number;
  created_by_name?: string;
  has_children?: number;
  closing_date?: string;
}

export default function MemberEventsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [userDept, setUserDept] = useState("");
  const [parentEvents, setParentEvents] = useState<Event[]>([]);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subParentId, setSubParentId] = useState<number | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<number, boolean>>({});
  const { show, ToastComponent } = useToast();

  const toggleExpand = async (id: number) => {
    const willExpand = !expandedEvents[id];
    setExpandedEvents(prev => ({ ...prev, [id]: willExpand }));
    if (willExpand) {
      const res = await fetch(`/api/events?parentId=${id}`);
      const data = await res.json();
      if (data.events?.length) {
        setEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEvents = data.events.filter((e: Event) => !existingIds.has(e.id));
          if (newEvents.length === 0) return prev;
          return [...prev, ...newEvents];
        });
        setParentEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEvents = data.events.filter((e: Event) => !existingIds.has(e.id));
          if (newEvents.length === 0) return prev;
          return [...prev, ...newEvents];
        });
      }
    }
  };

  const displayRows = useMemo(() => {
    const mains = events.filter(e => e.type === 'main').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const subs = events.filter(e => e.type === 'sub');
    const result: Event[] = [];
    const depth: Record<number, number> = {};
    const addChildren = (parentId: number, d: number) => {
      subs.filter(s => s.parent_id === parentId).forEach(child => {
        result.push(child);
        depth[child.id] = d;
        if (expandedEvents[child.id]) addChildren(child.id, d + 1);
      });
    };
    mains.forEach(m => { result.push(m); depth[m.id] = 0; if (expandedEvents[m.id]) addChildren(m.id, 1); });
    const orphaned = subs.filter(s => !mains.some(m => m.id === s.parent_id) && !subs.some(s2 => s2.id === s.parent_id));
    orphaned.forEach(o => { result.push(o); depth[o.id] = 0; if (expandedEvents[o.id]) addChildren(o.id, 1); });
    return { rows: result, depth };
  }, [events, expandedEvents]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || (d.user.role !== "member" && d.user.role !== "admin")) router.replace("/login");
      else {
        setAuthChecked(true);
        if (d.user.department) setUserDept(d.user.department);
      }
    });
  }, []);

  const load = async () => {
    const [res, allRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/events?type=main"),
    ]);
    const data = await res.json();
    const allData = await allRes.json();
    if (data.events) setEvents(data.events);
    if (allData.events) {
      const memberSubs = (data.events || []).filter((e: Event) => e.type === 'sub');
      setParentEvents([...allData.events, ...memberSubs]);
    }
  };

  useEffect(() => { load(); }, []);

  const createSubEvent = async (data: any) => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, type: 'sub', department: userDept }),
    });
    if (res.ok) {
      show("Sub-event created", "success");
      setSubModalOpen(false);
      load();
    } else {
      const err = await res.json();
      show(err.error || "Failed to create sub-event", "error");
    }
  };

  const endEvent = async (ev: Event) => {
    if (!confirm(`Are you sure you want to end "${ev.title}"? Members will no longer be able to upload images.`)) return;
    const res = await fetch(`/api/events/${ev.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    if (res.ok) { show("Event ended successfully", "success"); load(); }
    else show("Failed to end event", "error");
  };

  const reopenEvent = async (ev: Event) => {
    const res = await fetch(`/api/events/${ev.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    if (res.ok) { show("Event reopened", "success"); load(); }
    else show("Failed to reopen event", "error");
  };

  const handleEdit = async (data: any) => {
    if (!editEvent) return;
    const res = await fetch(`/api/events/${editEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { show("Event updated", "success"); setEditEvent(null); load(); }
    else show("Failed to update event", "error");
  };

  const handleDelete = async (ev: Event) => {
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
    if (res.ok) { show("Event deleted", "success"); load(); }
    else show("Delete failed", "error");
  };

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="member" />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <div className="section-header">
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 4 }}>My Events</h1>
              <p style={{ color: "var(--color-gov-muted)", fontSize: "0.875rem" }}>
                Events you can upload images to — {events.length} event{events.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button className="btn-gold btn-sm" onClick={() => { setSubModalOpen(true); setSubParentId(null); }}>
              <PlusCircle size={14} /> Create Sub-Event
            </button>
          </div>

          <div className="gov-card">
            {events.length === 0 ? (
              <div className="empty-state">
                <Calendar size={32} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
                <p style={{ fontWeight: 600 }}>No events assigned</p>
                <p style={{ fontSize: "0.875rem" }}>You haven&apos;t been assigned to any events yet. Contact your admin.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Event</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Closes</th>
                      <th>Images</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.rows.map((ev) => {
                      const hasChildren = !!ev.has_children;
                      const d = displayRows.depth[ev.id] || 0;
  if (!authChecked) return null;

  return (
                        <tr key={ev.id}>
                          <td>
                            {hasChildren && (
                              <button
                                onClick={() => toggleExpand(ev.id)}
                                style={{
                                  background: "none", border: "none", cursor: "pointer",
                                  color: "var(--color-gov-muted)", display: "flex", alignItems: "center"
                                }}
                              >
                                {expandedEvents[ev.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {d > 0 && <span style={{ color: "var(--color-gov-muted)", opacity: 0.5 }}>{'└'.repeat(d)}</span>}
                              <Link href={`/events/${ev.id}`} style={{ color: "var(--color-gov-navy)", fontWeight: 600, textDecoration: "none" }}>
                                {ev.title}
                              </Link>
                            </div>
                            {d > 0 && ev.parent_id && (
                              <div style={{ fontSize: "0.75rem", color: "var(--color-gov-muted)", marginLeft: 16 }}>
                                Part of: {events.find(e => e.id === ev.parent_id)?.title || "Unknown"}
                              </div>
                            )}
                            <div style={{ fontSize: "0.75rem", color: "var(--color-gov-muted)", marginLeft: d > 0 ? 16 : 0 }}>
                              by {ev.created_by_name || "—"}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <span className={`badge badge-${ev.type}`} style={{ textTransform: "uppercase" }}>
                                {ev.type}
                              </span>
                              {ev.department ? (
                                <span style={{
                                  padding: "2px 8px", borderRadius: 999, fontSize: "0.75rem",
                                  background: "rgba(201,168,76,0.1)", color: "var(--color-gov-gold)",
                                  border: "1px solid rgba(201,168,76,0.25)", fontWeight: 600,
                                }}>
                                  {ev.department}
                                </span>
                              ) : (
                                <span style={{ color: "var(--color-gov-muted)" }}>—</span>
                              )}
                            </div>
                          </td>
                          <td style={{ color: "var(--color-gov-muted)" }}>
                            {ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td>
                            {ev.closing_date ? (
                              <span style={{
                                color: new Date(ev.closing_date) < new Date() ? "var(--color-gov-danger, #ef4444)" : "var(--color-gov-muted)"
                              }}>
                                {new Date(ev.closing_date).toLocaleDateString("en-IN")}
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ color: "var(--color-gov-muted)" }}>{ev.image_count || "—"}</td>
                          <td><span className={`badge badge-${ev.status}`}>{ev.status}</span></td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="btn-outline btn-sm" onClick={() => setEditEvent(ev)} title="Edit event info">
                                <Edit2 size={12} />
                              </button>
                              {ev.status === "active" && (
                                <Link href={`/member/upload?eventId=${ev.id}`} className="btn-primary btn-sm" title="Upload images">
                                  <Upload size={12} />
                                </Link>
                              )}
                              <button className="btn-gold btn-sm" onClick={() => { setSubModalOpen(true); setSubParentId(ev.id); }} title="Add sub-event">
                                <PlusCircle size={12} />
                              </button>
                              {ev.status === "active" ? (
                                <button className="btn-outline btn-sm" onClick={() => endEvent(ev)} title="End this event">
                                  <XCircle size={12} />
                                </button>
                              ) : (
                                !(ev.closing_date && ev.closing_date < new Date().toISOString().slice(0, 10)) && (
                                  <button className="btn-outline btn-sm" onClick={() => reopenEvent(ev)} title="Reopen this event"
                                    style={{ color: "var(--color-gov-success, #22c55e)", borderColor: "var(--color-gov-success, #22c55e)" }}>
                                    <CheckCircle size={12} />
                                  </button>
                                )
                              )}
                              <button className="btn-danger btn-sm" onClick={() => handleDelete(ev)} title="Delete event">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {subModalOpen && (
        <EventFormModal
          heading="Create Sub-Event"
          onSubmit={createSubEvent}
          onClose={() => { setSubModalOpen(false); setSubParentId(null); }}
          parentEvents={parentEvents}
          subOnly
          initialData={{
            title: "",
            description: "",
            event_date: "",
            location: "",
            country: "",
            state: "",
            district: "",
            parent_id: subParentId,
            department: userDept,
          }}
        />
      )}

      {editEvent && (
        <EventFormModal
          heading={`Edit: ${editEvent.title}`}
          initialData={{
            title: editEvent.title,
            description: editEvent.description || "",
            event_date: editEvent.event_date || "",
            location: editEvent.location || "",
            country: (editEvent as any).country || "",
            state: (editEvent as any).state || "",
            district: (editEvent as any).district || "",
            closing_date: editEvent.closing_date || "",
            type: editEvent.type as any,
            parent_id: editEvent.parent_id,
            department: editEvent.department,
          }}
          onSubmit={handleEdit}
          onClose={() => setEditEvent(null)}
          parentEvents={parentEvents}
          availableDepartments={[]}
          hideTypeSelection
        />
      )}
      {ToastComponent}
    </>
  );
}
