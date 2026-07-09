import Link from "next/link";
import Navbar from "@/components/Navbar";
import RandomImageGrid from "@/components/RandomImageGrid";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Calendar, Image as ImgIcon, ArrowRight, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await getDb();
  const session = await getSession();

  const stats = {
    events: (db.prepare("SELECT COUNT(*) as c FROM events WHERE status='active'").get() as any).c,
    images: (db.prepare("SELECT COUNT(*) as c FROM images").get() as any).c,
    participants: (db.prepare("SELECT SUM(participant_count) as s FROM events").get() as any).s || 0,
  };

  const randomImages = db.prepare(`
    SELECT i.filename, i.caption, e.title as event_title, e.id as event_id
    FROM images i
    JOIN events e ON e.id = i.event_id
    ORDER BY RANDOM() LIMIT 6
  `).all() as { filename: string; caption: string | null; event_title: string; event_id: number }[];

  return (
    <>
      <Navbar />
      <main>
        <section suppressHydrationWarning style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "120px 24px 60px",
          position: "relative",
          zIndex: 1,
          background: "radial-gradient(circle at 50% 50%, rgba(97, 175, 239, 0.05) 0%, transparent 70%)"
        }}>
          <div style={{ maxWidth: 850 }}>
            <h1 style={{
              fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: 24,
              color: "white"
            }}>
              <span style={{ color: "var(--color-gov-gold)" }}>Event</span> Viewer
            </h1>

            <p style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "var(--color-gov-muted)",
              maxWidth: 640,
              margin: "0 auto 44px",
              lineHeight: 1.6
            }}>
              Browse and manage event archives, departmental documentation, and photographic records.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/events" className="btn-gold" style={{ padding: "14px 36px", fontSize: "1rem" }}>
                Explore Gallery <ArrowRight size={18} />
              </Link>
              {!session && (
                <Link href="/login" className="btn-outline" style={{ padding: "14px 36px", fontSize: "1rem" }}>
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {randomImages.length > 0 && <RandomImageGrid images={randomImages} />}

          <div className="stats-bar" style={{
            maxWidth: 800, width: "100%", margin: "48px auto 0",
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1, background: "var(--color-gov-border)",
            border: "1px solid var(--color-gov-border)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}>
            {[
              { label: "Active Events", value: stats.events, icon: Calendar },
              { label: "Images Archived", value: stats.images, icon: ImgIcon },
              { label: "Total Participants", value: stats.participants, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ padding: "24px 16px", textAlign: "center", background: "var(--color-gov-surface)" }}>
                <Icon size={20} color="var(--color-gov-gold)" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "white" }}>{value}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--color-gov-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
