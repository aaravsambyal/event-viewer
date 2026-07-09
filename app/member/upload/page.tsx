"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ImageGallery, { GalleryHandle } from "@/components/ImageGallery";
import { useToast } from "@/components/Toast";
import { Upload, ChevronLeft, Image, X, CloudUpload, ChevronDown, ZoomIn, Trash2, CheckSquare, Square } from "lucide-react";
import Link from "next/link";

export default function MemberUploadPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userDept, setUserDept] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | "">("");
  const [images, setImages] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [gallerySelectedCount, setGallerySelectedCount] = useState(0);
  const galleryRef = useRef<GalleryHandle>(null);
  const { show, ToastComponent } = useToast();

  // Load events
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eid = params.get("eventId");
    if (eid) setSelectedEventId(parseInt(eid));

    fetch("/api/events").then(r => r.json()).then(data => {
      if (data.events) setEvents(data.events);
    });
  }, []);

  // Auth check
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || (d.user.role !== "member" && d.user.role !== "admin")) router.replace("/login");
      else {
        setUserDept(d.user.department || null);
        setUserId(d.user.id);
        setUserRole(d.user.role);
        setAuthChecked(true);
      }
    });
  }, []);

  const loadImages = useCallback(async () => {
    const url = selectedEventId
      ? `/api/events/${selectedEventId}/images`
      : `/api/images`;
    const res = await fetch(url);
    const data = await res.json();
    let imgs = data.images || [];

    // Members only see their own uploads and admin see all
    if (userRole === "member" && userId) {
      imgs = imgs.filter((img: any) => img.uploader_id === userId);
    }
    setImages(imgs);
  }, [selectedEventId, userDept, userId, userRole]);

  useEffect(() => {
    if (authChecked) {
      loadImages();
    }
  }, [authChecked, loadImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = [...files, ...selected];
    const newPreviews = [...previews, ...selected.map((f) => URL.createObjectURL(f))];
    const newCaptions = [...captions, ...selected.map(() => "")];
    setFiles(newFiles);
    setPreviews(newPreviews);
    setCaptions(newCaptions);
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
    setCaptions(captions.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!selectedEventId) { show("Select an event to upload to", "error"); return; }
    setUploading(true);
    setProgress(0);
    let uploaded = 0;
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append("image", files[i]);
      fd.append("caption", captions[i] || "");
      try {
        const res = await fetch(`/api/events/${selectedEventId}/images`, { method: "POST", body: fd });
        if (!res.ok) {
          const d = await res.json();
          show(`Failed: ${d.error}`, "error");
        } else {
          uploaded++;
        }
      } catch {
        show("Upload error", "error");
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setUploading(false);
    if (uploaded > 0) {
      show(`${uploaded} image${uploaded !== 1 ? "s" : ""} uploaded successfully`, "success");
      setFiles([]);
      setPreviews([]);
      setCaptions([]);
      loadImages();
    }
  };

  if (!authChecked) return null;

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", minHeight: "calc(100vh - 67px)" }}>
        <Sidebar role="member" />
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <Link href="/member" style={{ display: "inline-flex", alignItems: "center", gap: 6,
            color: "var(--color-gov-muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: 20 }}>
            <ChevronLeft size={15} /> Dashboard
          </Link>

          {/* Upload area */}
          <div className="gov-card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gov-gold)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Upload size={13} />
              Select Images to Upload
            </div>

            {/* Event selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: 6, color: "var(--color-gov-text)" }}>
                Upload to Event
              </label>
              <div style={{ position: "relative", display: "inline-block", minWidth: 280 }}>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value ? parseInt(e.target.value) : "")}
                  className="form-input"
                  style={{ width: "100%", padding: "10px 32px 10px 12px", fontSize: "0.875rem", appearance: "none", cursor: "pointer" }}
                >
                  <option value="">-- Select an event --</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}{ev.department ? ` (${ev.department})` : ""} - {ev.type === "sub" ? "Sub" : "Main"}{ev.event_date ? ` - ${new Date(ev.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-gov-muted)" }} />
              </div>
              {selectedEvent && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-gov-navy)", marginTop: 6 }}>
                  Uploading to: <strong>{selectedEvent.title}</strong> {selectedEvent.department ? `(${selectedEvent.department})` : ""}
                </p>
              )}
            </div>

            <label
              htmlFor="file-input"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "40px 24px",
                border: "2px dashed var(--color-gov-border)",
                borderRadius: 10, cursor: "pointer",
                background: "var(--color-gov-navy-dark)",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-gov-navy)"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-gov-border)"; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--color-gov-border)";
                const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
                const newFiles = [...files, ...dropped];
                setFiles(newFiles);
                setPreviews([...previews, ...dropped.map((f) => URL.createObjectURL(f))]);
                setCaptions([...captions, ...dropped.map(() => "")]);
              }}
            >
              <CloudUpload size={36} style={{ marginBottom: 12, color: "var(--color-gov-navy)", opacity: 0.5 }} />
              <p style={{ fontWeight: 600, color: "var(--color-gov-text)", marginBottom: 4 }}>
                Click or drag images here
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-gov-muted)" }}>
                JPEG, PNG, GIF, WebP - max 10MB each
              </p>
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

          {/* Previews */}
          {files.length > 0 && (
            <div className="gov-card" style={{ padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  Selected ({files.length} image{files.length !== 1 ? "s" : ""})
                </h2>
                <button className="btn-primary" onClick={handleUpload} disabled={uploading || !selectedEventId}>
                  <Upload size={15} />
                  {uploading ? `Uploading… ${progress}%` : "Upload All"}
                </button>
              </div>

              {uploading && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 6, background: "var(--color-gov-border)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-gov-navy)", transition: "width 0.3s ease", borderRadius: 3 }} />
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {files.map((file, idx) => (
                  <div key={idx} style={{ border: "1px solid var(--color-gov-border)", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ position: "relative", paddingTop: "65%", cursor: "pointer" }} onClick={() => setPreviewIdx(idx)}>
                      <img src={previews[idx]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-gov-muted)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </p>
                      <input
                        type="text"
                        placeholder="Caption (optional)"
                        value={captions[idx]}
                        onChange={(e) => {
                          const c = [...captions];
                          c[idx] = e.target.value;
                          setCaptions(c);
                        }}
                        className="form-input"
                        style={{ fontSize: "0.8rem", padding: "6px 8px" }}
                        maxLength={200}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All images */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.05rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Image size={17} /> {selectedEvent ? `Event Images (${images.length})` : `All Images (${images.length})`}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {gallerySelectedCount > 0 ? (
                  <>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-gov-muted)" }}>
                      {gallerySelectedCount} selected
                    </span>
                    <button className="btn-outline btn-sm" onClick={() => galleryRef.current?.deselectAll()} style={{ fontSize: "0.75rem" }}>
                      Deselect
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => galleryRef.current?.handleBatchDelete()} style={{ fontSize: "0.75rem" }}>
                      <Trash2 size={12} /> Delete Selected
                    </button>
                  </>
                ) : (
                  <button className="btn-outline btn-sm" onClick={() => galleryRef.current?.selectAll()} style={{ fontSize: "0.75rem" }}>
                    <CheckSquare size={12} /> Select All
                  </button>
                )}
              </div>
            </div>
            <ImageGallery
              ref={galleryRef}
              images={images}
              canDelete
              hideToolbar
              onSelectionChange={(count) => setGallerySelectedCount(count)}
              onDelete={async (imageId) => {
                if (!confirm("Delete this image?")) return;
                const res = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
                if (res.ok) {
                  show("Image deleted", "success");
                  loadImages();
                } else {
                  show("Failed to delete image", "error");
                }
              }}
              onBatchDelete={async (ids) => {
                let deleted = 0;
                for (const id of ids) {
                  const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
                  if (res.ok) deleted++;
                }
                show(`${deleted} image${deleted !== 1 ? "s" : ""} deleted`, "success");
                loadImages();
              }}
              canEditCaption
              onCaptionEdit={async (imageId, caption) => {
                const res = await fetch(`/api/images/${imageId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ caption }),
                });
                if (res.ok) {
                  show("Caption updated", "success");
                  loadImages();
                } else {
                  show("Failed to update caption", "error");
                }
              }}
            />
          </div>
        </main>
      </div>
      {/* Preview lightbox for selected files */}
      {previewIdx !== null && (
        <div className="lightbox" onClick={() => setPreviewIdx(null)}>
          <button
            onClick={() => setPreviewIdx(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%", width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white", zIndex: 10,
            }}
          >
            <X size={20} />
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh" }}>
            <img
              src={previews[previewIdx]}
              alt=""
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8, display: "block" }}
            />
          </div>
        </div>
      )}
      {ToastComponent}
    </>
  );
}
