"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Event {
  id: number;
  title: string;
  type: string;
  event_date?: string;
  closing_date?: string;
  country?: string;
  state?: string;
  district?: string;
  location?: string;
}

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  location: string;
  country?: string;
  state?: string;
  district?: string;
  closing_date?: string;
  type?: 'main' | 'sub';
  parent_id?: number | null;
  department?: string;
  participant_count?: string;
}

interface EventFormModalProps {
  heading: string;
  initialData?: EventFormData;
  onSubmit: (data: EventFormData) => Promise<void>;
  onClose: () => void;
  parentEvents?: Event[];
  availableDepartments?: string[];
  subOnly?: boolean;
  hideTypeSelection?: boolean;
}

export default function EventFormModal({
  heading,
  initialData,
  onSubmit,
  onClose,
  parentEvents = [],
  availableDepartments = ["Education Department", "Health Department", "Public Works", "Administration", "Police"],
  subOnly = false,
  hideTypeSelection = false,
}: EventFormModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [eventDate, setEventDate] = useState(initialData?.event_date || "");
  const [country, setCountry] = useState(initialData?.country || "");
  const [state, setState] = useState(initialData?.state || "");
  const [district, setDistrict] = useState(initialData?.district || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [closingDate, setClosingDate] = useState(initialData?.closing_date || "");
  const [type, setType] = useState<'main' | 'sub'>(subOnly ? 'sub' : (initialData?.type || 'main'));
  const [parentId, setParentId] = useState<number | null>(initialData?.parent_id || null);
  const [department, setDepartment] = useState(initialData?.department || "");
  const [participantCount, setParticipantCount] = useState(initialData?.participant_count || "");
  const [loading, setLoading] = useState(false);

  const parentEvent = parentId ? parentEvents.find(e => e.id === parentId) : null;

  useEffect(() => {
    if (parentId) {
      const parent = parentEvents.find(e => e.id === parentId);
      if (parent) {
        if (parent.event_date) setEventDate(parent.event_date);
        if (parent.closing_date) setClosingDate(parent.closing_date);
        if (parent.country) setCountry(parent.country);
        if (parent.state) setState(parent.state);
        if (parent.district) setDistrict(parent.district);
        if (parent.location) setLocation(parent.location);
      }
    }
  }, [parentId, parentEvents]);

  const dateWarning = (() => {
    if (!parentEvent || !(type === 'sub' || subOnly)) return null;
    const warnings: string[] = [];
    if (parentEvent.event_date && eventDate && eventDate < parentEvent.event_date) {
      warnings.push(`Event date cannot be before parent's start date (${parentEvent.event_date})`);
    }
    if (parentEvent.closing_date && closingDate && closingDate > parentEvent.closing_date) {
      warnings.push(`Closing date cannot be after parent's closing date (${parentEvent.closing_date})`);
    }
    return warnings.length > 0 ? warnings : null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateWarning) return;
    setLoading(true);
    try {
      const resolvedType = subOnly ? 'sub' : type;
      const loc = location || [district, state, country].filter(Boolean).join(", ");
      await onSubmit({ 
        title, 
        description, 
        event_date: eventDate, 
        location: loc,
        country: country || undefined,
        state: state || undefined,
        district: district || undefined,
        closing_date: closingDate,
        participant_count: participantCount || undefined,
        type: resolvedType,
        parent_id: resolvedType === 'sub' ? parentId : null,
        department: subOnly ? (initialData?.department || "") : (resolvedType === 'sub' ? department : (initialData?.department || ""))
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-gov-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>{heading}</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-gov-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {!subOnly && !hideTypeSelection && (
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Event Structure</label>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", cursor: "pointer" }}>
                  <input type="radio" name="type" checked={type === 'main'} onChange={() => setType('main')} /> Main Event
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", cursor: "pointer" }}>
                  <input type="radio" name="type" checked={type === 'sub'} onChange={() => setType('sub')} /> Sub Event
                </label>
              </div>
            </div>
          )}

          {(type === 'sub' || subOnly) && (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: (subOnly || availableDepartments.length === 0) ? "1fr" : "1fr 1fr", 
              gap: 14, 
              marginBottom: 14 
            }}>
              <div>
                <label className="form-label">Parent Event *</label>
                <select 
                  className="form-input" 
                  value={parentId || ""} 
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                  required
                >
                  <option value="">Select Parent Event</option>
                  {parentEvents.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.type}) {e.event_date ? `- ${e.event_date}` : ''}{e.closing_date ? ` / ${e.closing_date}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {!subOnly && availableDepartments.length > 0 && (
                <div>
                  <label className="form-label">Assigned Department *</label>
                  <select 
                    className="form-input" 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    {availableDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Event Title *</label>
            <input
              id="event-title"
              className="form-input"
              placeholder={type === 'main' ? "e.g. Independence Day 2024" : "e.g. Education Dept Drill"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Description</label>
            <textarea
              id="event-description"
              className="form-input"
              placeholder="Event details and purpose…"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Event Date *</label>
              <input
                id="event-date"
                type="date"
                className="form-input"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Closing Date *
                <span style={{ fontSize: "0.65rem", color: "var(--color-gov-muted)", fontWeight: 400 }}>
                  (auto-closes)
                </span>
              </label>
              <input
                id="event-closing-date"
                type="date"
                className="form-input"
                value={closingDate}
                min={eventDate || undefined}
                onChange={(e) => setClosingDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Participants</label>
            <input
              type="number"
              min="0"
              className="form-input"
              placeholder="e.g. 500"
              value={participantCount}
              onChange={(e) => setParticipantCount(e.target.value)}
            />
          </div>
          {dateWarning && (
            <div style={{
              marginBottom: 14,
              padding: "8px 12px",
              borderRadius: 6,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--color-gov-danger, #ef4444)",
              fontSize: "0.8rem",
            }}>
              {dateWarning.map((w, i) => <div key={i}>{w}</div>)}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Country *</label>
              <input
                id="event-country"
                className="form-input"
                placeholder="e.g. India"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">State *</label>
              <input
                id="event-state"
                className="form-input"
                placeholder="e.g. Karnataka"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">District *</label>
              <input
                id="event-district"
                className="form-input"
                placeholder="e.g. Bengaluru"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !!dateWarning}>
              {loading ? "Saving…" : "Save Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
