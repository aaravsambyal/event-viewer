"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import EventCard from "@/components/EventCard";

function SubEventNode({ event, allSubs, depth = 1 }: { event: any; allSubs: any[]; depth?: number }) {
  const [open, setOpen] = useState(true);
  const children = allSubs.filter(s => s.parent_id === event.id);

  return (
    <div style={{ marginLeft: depth * 12, borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: 10, marginTop: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {children.length > 0 && (
          <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-gov-muted)", padding: 0, display: "flex" }}>
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        {children.length === 0 && <span style={{ width: 12 }} />}
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Sub{`-Event${depth > 1 ? ` Lv${depth}` : ""}`}
        </span>
      </div>
      <EventCard event={event} isSub depth={depth} />
      {open && children.map(child => (
        <SubEventNode key={child.id} event={child} allSubs={allSubs} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function EventGroup({ main, allSubs }: { main: any; allSubs: any[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const children = allSubs.filter(s => s.parent_id === main.id);

  return (
    <div className="event-group">
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isOpen ? 16 : 0,
          paddingBottom: 10,
          borderBottom: "2px solid var(--color-gov-gold)",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: "var(--color-gov-gold)" }}>
            {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>{main.title}</h2>
            {main.description && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", marginTop: 2, marginBottom: 0 }}>{main.description}</p>}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Link href={`/events/${main.id}`} className="btn-gold" style={{ textDecoration: "none", fontSize: "0.8rem", padding: "6px 14px" }}>
            View Gallery
          </Link>
        </div>
      </div>

      {isOpen && children.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {children.map(sub => (
            <SubEventNode key={sub.id} event={sub} allSubs={allSubs} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}