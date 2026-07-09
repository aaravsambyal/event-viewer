"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/Toast";
import EventFormModal from "@/components/EventFormModal";
import { Plus, Trash2, Calendar, Edit2, XCircle, CheckCircle, ChevronDown, ChevronRight, Upload } from "lucide-react";
import Link from "next/link";

interface Event {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  location: string;
  status: string;
  type: string;
  parent_id?: number;
  created_at: string;
  created_by_name: string;
  department?: string;
  image_count: number;
  participant_count?: number;
  has_children?: number;
  closing_date?: string;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Record<number, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const { show, ToastComponent } = useToast();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== "admin") router.replace("/login");
      else setAuthChecked(true);
    });
  }, []);

  const load = async () => {
    const [evRes, deptRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/departments")
    ]);
    const evData = await evRes.json();
    const deptData = await deptRes.json();
    
    if (evData.events) setEvents(evData.events);
    if (deptData.departments) setDepartments(deptData.departments);
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id: number) => {
    setExpandedEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sortFn = (a: any, b: any) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };

  const displayRows = useMemo(() => {
    const mains = events.filter(e => e.type === 'main').sort(sortFn);
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
    orphaned.forEach(o => { result.push(o); depth[o.id] = 0; });
    return { rows: result, depth };
  }, [events, expandedEvents]);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (!res.ok) { show(d.error || "Failed to create event", "error"); return; }
    show("Event created successfully", "success");
    setShowCreate(false);
    load();
  };

  const handleEdit = async (data: any) => {
    if (!editEvent) return;
    const res = await fetch(`/api/events/${editEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { show("Event updated", "success"); setEditEvent(null); load(); }
    else show("Update failed", "error");
  };

  const handleToggleStatus = async (ev: Event) => {
    const newStatus = ev.status === "active" ? "closed" : "active";
    const res = await fetch(`/api/events/${ev.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { show(`Event ${newStatus}`, "success"); load(); }
    else show("Failed to update status", "error");
  };

  const handleDelete = async (ev: Event) => {
    if (!confirm(`Delete "${ev.title}"? All images will be permanently removed.`)) return;
    const res = await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
    if (res.ok) { show("Event deleted", "success"); load(); }
    else show("Delete failed", "error");
  };

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="admin" />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <div className="section-header">
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 4 }}>All Events</h1>
              <p style={{ color: "var(--color-gov-muted)", fontSize: "0.875rem" }}>
                {events.length} event{events.length !== 1 ? "s" : ""} total
              </p>
            </div>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Event
            </button>
          </div>



          <div className="gov-card">
            {displayRows.rows.length === 0 ? (
              <div className="empty-state">
                <Calendar size={32} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
                <p style={{ fontWeight: 600 }}>No events yet</p>
                <p style={{ fontSize: "0.875rem" }}>Create the first event above.</p>
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
                      <th>Location</th>
                      <th>Images</th>
                      <th>Participants</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.rows.map((ev) => {
                      const d = displayRows.depth[ev.id] || 0;
                      const hasChildren = !!ev.has_children;
                      
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
                              <div style={{ fontSize: "0.75rem", color: "var(--color-gov-muted)", marginLeft: 16 + d * 8 }}>
                                Part of: {events.find(e => e.id === ev.parent_id)?.title || "Unknown Event"}
                              </div>
                            )}
                            <div style={{ fontSize: "0.75rem", color: "var(--color-gov-muted)", marginLeft: d > 0 ? 16 + d * 8 : 0 }}>
                              by {ev.created_by_name}
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
                        <td style={{ color: "var(--color-gov-muted)" }}>
                          {ev.location || "—"}
                        </td>
                        <td style={{ color: "var(--color-gov-muted)" }}>{ev.image_count || "—"}</td>
                        <td>
                          <ParticipantCell eventId={ev.id} value={ev.participant_count} />
                        </td>
                        <td><span className={`badge badge-${ev.status}`}>{ev.status}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn-outline btn-sm"
                              onClick={() => setEditEvent(ev)}
                              title="Edit event"
                            >
                              <Edit2 size={12} />
                            </button>
                            {ev.status === "active" && (
                              <Link href={`/member/upload?eventId=${ev.id}`} className="btn-primary btn-sm" title="Upload images">
                                <Upload size={12} />
                              </Link>
                            )}
                            {(ev.type === 'main' || ev.type === 'sub') && (
                              <button
                                className="btn-gold btn-sm"
                                onClick={() => {
                                  setEditEvent({
                                    id: 0,
                                    title: "",
                                    type: "sub",
                                    parent_id: ev.id,
                                    status: "active",
                                    created_at: "",
                                    created_by_name: "",
                                    image_count: 0,
                                    event_date: "",
                                    location: ""
                                  });
                                }}
                                title="Add sub-event"
                              >
                                <Plus size={12} />
                              </button>
                            )}
                            {ev.status === "active" ? (
                              <button
                                className="btn-outline btn-sm"
                                onClick={() => handleToggleStatus(ev)}
                                title="Close event"
                              >
                                <XCircle size={12} />
                              </button>
                            ) : (
                              !(ev.closing_date && ev.closing_date < new Date().toISOString().slice(0, 10)) && (
                                <button
                                  className="btn-outline btn-sm"
                                  onClick={() => handleToggleStatus(ev)}
                                  title="Reopen event"
                                  style={{ color: "var(--color-gov-success, #22c55e)", borderColor: "var(--color-gov-success, #22c55e)" }}
                                >
                                  <CheckCircle size={12} />
                                </button>
                              )
                            )}
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => handleDelete(ev)}
                              title="Delete event"
                            >
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

      {showCreate && (
        <EventFormModal
          heading="Create New Event"
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
          parentEvents={events}
          availableDepartments={departments}
        />
      )}

      {editEvent && (
        <EventFormModal
          heading={editEvent.id === 0 ? "Add Sub-event" : `Edit: ${editEvent.title}`}
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
            department: editEvent.department
          }}
          onSubmit={editEvent.id === 0 ? handleCreate : handleEdit}
          onClose={() => setEditEvent(null)}
          parentEvents={events.filter(e => e.id !== editEvent.id)}
          availableDepartments={departments}
        />
      )}

      {ToastComponent}
    </>
  );
}

function ParticipantCell({ eventId, value }: { eventId: number; value?: number }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(value?.toString() || "0");
  const { show } = useToast();

  const handleSave = async () => {
    const count = parseInt(inputVal);
    if (isNaN(count) || count < 0) return;
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_count: count }),
    });
    if (res.ok) {
      show("Participants updated", "success");
      setEditing(false);
    } else {
      show("Failed to update", "error");
    }
  };

  if (editing) {
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <input
          type="number"
          min="0"
          className="form-input"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          style={{ width: 70, padding: "4px 6px", fontSize: "0.8rem" }}
          autoFocus
        />
        <button className="btn-primary btn-sm" onClick={handleSave} style={{ padding: "4px 8px", fontSize: "0.7rem" }}>Save</button>
        <button className="btn-outline btn-sm" onClick={() => setEditing(false)} style={{ padding: "4px 8px", fontSize: "0.7rem" }}>Cancel</button>
      </div>
    );
  }

  return (
    <span
      style={{ cursor: "pointer", color: "var(--color-gov-muted)", textDecoration: "underline dotted rgba(255,255,255,0.2)" }}
      onClick={() => { setInputVal(value?.toString() || "0"); setEditing(true); }}
      title="Click to edit"
    >
      {value != null ? value : "—"}
    </span>
  );
}
