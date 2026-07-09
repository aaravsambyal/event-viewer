"use client";

import Link from "next/link";
import { Calendar, MapPin, Image as ImgIcon, ArrowRight, Users } from "lucide-react";

interface EventCardProps {
  event: {
    id: number;
    title: string;
    description?: string;
    event_date: string;
    location: string;
    status: string;
    image_count: number;
    department?: string;
    participant_count?: number;
  };
  href?: string;
  showStatus?: boolean;
  isSub?: boolean;
  depth?: number;
}

export default function EventCard({ event, href, showStatus = true, isSub = false, depth = 0 }: EventCardProps) {
  const linkHref = href || `/events/${event.id}`;
  const subColor = depth === 1 ? "var(--color-gov-navy)" : "var(--color-gov-muted)";

  return (
    <Link href={linkHref} style={{ textDecoration: "none", display: "block" }}>
        <article
          className="gov-card"
          style={{
            padding: 24,
            cursor: "pointer",
            borderTop: isSub ? `3px solid ${subColor}` : "3px solid var(--color-gov-gold)",
            height: "100%",
            transition: "box-shadow 0.2s, transform 0.2s",
            opacity: isSub ? Math.max(0.85, 1 - depth * 0.05) : 1,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-elevated)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "";
            (e.currentTarget as HTMLElement).style.transform = "";
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "white", lineHeight: 1.3, margin: 0 }}>
                {event.title}
              </h2>
              {event.department && (
                <div style={{
                  marginTop: 6, display: "inline-block", padding: "1px 8px",
                  background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: 4, fontSize: "0.65rem", color: "var(--color-gov-gold)", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.025em"
                }}>
                  {event.department}
                </div>
              )}
            </div>
            {showStatus && (
              <span className={`badge badge-${event.status}`} style={{ flexShrink: 0, marginLeft: 8 }}>
                {event.status}
              </span>
            )}
          </div>

        {event.description && (
          <p className="line-clamp-2" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 16 }}>
            {event.description}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
          {event.event_date && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={13} />
              {new Date(event.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          )}
          {event.location && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={13} />
              {event.location}
            </span>
          )}
          {event.participant_count !== undefined && event.participant_count > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={13} style={{ width: 13, height: 13 }} />
              {event.participant_count} participants
            </span>
          )}
        </div>

        <div style={{ paddingTop: 14, borderTop: "1px solid var(--color-gov-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 4 }}>
            <ImgIcon size={13} />
            {event.image_count} image{event.image_count !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: "0.8125rem", color: isSub ? "var(--color-gov-navy)" : "var(--color-gov-gold)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            View Gallery <ArrowRight size={13} />
          </span>
        </div>
      </article>
    </Link>
  );
}
