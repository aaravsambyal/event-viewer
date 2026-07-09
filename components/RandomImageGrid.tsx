"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ImageItem {
  filename: string;
  caption: string | null;
  event_title: string;
  event_id: number;
}

export default function RandomImageGrid({ images: initialImages }: { images: ImageItem[] }) {
  const [images, setImages] = useState(initialImages);

  useEffect(() => {
    const fetchRandom = async () => {
      try {
        const res = await fetch("/api/images?random=6");
        const data = await res.json();
        if (data.images?.length) setImages(data.images);
      } catch {}
    };

    fetchRandom();
    const interval = setInterval(fetchRandom, 10000);
    return () => clearInterval(interval);
  }, []);

  if (images.length === 0) return null;

  const cols = images.length <= 3 ? images.length : images.length === 4 ? 2 : 3;
  const isPentagon = images.length === 5;

  if (isPentagon) {
    return (
      <div style={{
        maxWidth: 600, width: "100%", margin: "48px auto 0",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {images.slice(0, 3).map(img => (
            <Link key={img.filename} href={`/events/${img.event_id}`} style={{ textDecoration: "none", width: 185 }}>
              <div style={{
                borderRadius: 12, overflow: "hidden", position: "relative", aspectRatio: "1 / 1",
                border: "1px solid var(--color-gov-border)", background: "var(--color-gov-surface)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "var(--shadow-elevated)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <img src={`/uploads/${img.filename}`} alt={img.caption || img.event_title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {images.slice(3).map(img => (
            <Link key={img.filename} href={`/events/${img.event_id}`} style={{ textDecoration: "none", width: 185 }}>
              <div style={{
                borderRadius: 12, overflow: "hidden", position: "relative", aspectRatio: "1 / 1",
                border: "1px solid var(--color-gov-border)", background: "var(--color-gov-surface)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "var(--shadow-elevated)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <img src={`/uploads/${img.filename}`} alt={img.caption || img.event_title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: cols === 2 ? 600 : 900, width: "100%", margin: "48px auto 0",
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 12,
    }}>
      {images.map((img) => (
        <Link key={img.filename} href={`/events/${img.event_id}`} style={{ textDecoration: "none" }}>
          <div style={{
            borderRadius: 12, overflow: "hidden", position: "relative",
            border: "1px solid var(--color-gov-border)",
            background: "var(--color-gov-surface)",
            transition: "transform 0.2s, box-shadow 0.2s",
            aspectRatio: "1 / 1",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "var(--shadow-elevated)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <img
              src={`/uploads/${img.filename}`}
              alt={img.caption || img.event_title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}