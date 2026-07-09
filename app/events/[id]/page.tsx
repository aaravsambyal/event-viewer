"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImageGallery from "@/components/ImageGallery";
import { useToast } from "@/components/Toast";
import { Calendar, MapPin, User, Image, Upload, ChevronLeft, X, Users } from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [canUpload, setCanUpload] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { show, ToastComponent } = useToast();

  const loadData = useCallback(async () => {
    const [evRes, imgRes, meRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/events/${id}/images`),
      fetch("/api/auth/me"),
    ]);
    const evData = await evRes.json();
    const imgData = await imgRes.json();
    const meData = await meRes.json();

    if (evData.event) setEvent(evData.event);
    if (imgData.images) setImages(imgData.images);
    if (evData.members) setMembers(evData.members);

    const me = meData.user;
    setUser(me);

    if (me) {
      // Admins can upload to anything
      if (me.role === "admin") {
        setCanUpload(true);
      } else {
        // Members can upload if they are the creator, explicitly assigned, or in the same department
        const isCreator = evData.event && evData.event.created_by_id === me.id;
        const isAssignedMember = evData.members && evData.members.some((m: any) => m.id === me.id);
        const isAssignedDept = evData.event && evData.event.assigned_department === me.department;
        setCanUpload(isCreator || isAssignedMember || isAssignedDept);
      }
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("caption", caption);
      const res = await fetch(`/api/events/${id}/images`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { show(data.error || "Upload failed", "error"); return; }
      show("Image uploaded successfully", "success");
      setShowUpload(false);
      setFile(null);
      setCaption("");
      setPreviewUrl(null);
      loadData();
    } catch { show("Upload failed", "error"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (imgId: number) => {
    if (!confirm("Delete this image?")) return;
    const res = await fetch(`/api/images/${imgId}`, { method: "DELETE" });
    if (res.ok) { show("Image deleted", "success"); loadData(); }
    else show("Delete failed", "error");
  };

  const canDelete = user && (user.role === "admin" || user.role === "member");

  if (!event) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--color-gov-muted)" }}>
          <div style={{ fontSize: "1rem" }}>Loading event…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* Event Header */}
      <div style={{ background: "var(--color-gov-surface)", borderBottom: "1px solid var(--color-gov-border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
          <Link href="/events" style={{ display: "inline-flex", alignItems: "center", gap: 6,
            color: "var(--color-gov-muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: 16 }}>
            <ChevronLeft size={15} /> Back to Events
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-gov-text)" }}>
                  {event.title}
                </h1>
                <span className={`badge badge-${event.status}`}>{event.status}</span>
              </div>
              {event.description && (
                <p style={{ color: "var(--color-gov-muted)", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 640, marginBottom: 12 }}>
                  {event.description}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: "0.8125rem", color: "var(--color-gov-muted)" }}>
                {event.event_date && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={13} />
                    {new Date(event.event_date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                )}
                {event.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={13} /> {event.location}
                  </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <User size={13} /> {event.created_by_name}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={13} /> {event.participant_count > 0 ? event.participant_count : members.length} participants
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Image size={13} /> {event.image_count} images
                </span>
              </div>
            </div>

            {canUpload && event.status === "active" && (
              <button onClick={() => setShowUpload(true)} className="btn-gold">
                <Upload size={16} /> Upload Image
              </button>
            )}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <ImageGallery images={images} canDelete={canDelete} onDelete={handleDelete} />
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-gov-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1rem" }}>Upload Image</h2>
              <button onClick={() => setShowUpload(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-gov-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpload} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Select Image *</label>
                <input type="file" accept="image/*" onChange={handleFileChange} required
                  style={{ display: "block", fontSize: "0.875rem", color: "var(--color-gov-text)" }} />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" style={{ marginTop: 12, maxHeight: 200, borderRadius: 6, border: "1px solid var(--color-gov-border)" }} />
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Caption (optional)</label>
                <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)}
                  className="form-input" placeholder="Describe this image…" maxLength={200} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowUpload(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploading || !file}>
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ToastComponent}
    </>
  );
}
