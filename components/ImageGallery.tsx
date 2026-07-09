"use client";

import { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { X, Trash2, ZoomIn, User, Calendar, Filter, CheckSquare, Square } from "lucide-react";

interface ImageItem {
  id: number;
  filename: string;
  original_name?: string;
  caption?: string;
  uploaded_at: string;
  uploader_name?: string;
  event_department?: string;
  event_title?: string;
  event_id?: number;
}

interface GalleryProps {
  images: ImageItem[];
  canDelete?: boolean;
  onDelete?: (id: number) => void;
  canEditCaption?: boolean;
  onCaptionEdit?: (id: number, caption: string) => void;
  onBatchDelete?: (ids: number[]) => void;
  hideToolbar?: boolean;
  onSelectionChange?: (count: number) => void;
}

export interface GalleryHandle {
  selectAll: () => void;
  deselectAll: () => void;
  handleBatchDelete: () => void;
  selectedCount: number;
}

const ImageGallery = forwardRef<GalleryHandle, GalleryProps>(({ images, canDelete, onDelete, canEditCaption, onCaptionEdit, onBatchDelete, hideToolbar, onSelectionChange }, ref) => {
  const [lightbox, setLightbox] = useState<ImageItem | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useImperativeHandle(ref, () => ({
    selectAll,
    deselectAll,
    handleBatchDelete,
    selectedCount: selectedIds.size,
  }));

  const departments = useMemo(() => {
    const depts = new Set<string>();
    images.forEach(img => {
      if (img.event_department) depts.add(img.event_department);
    });
    return Array.from(depts).sort();
  }, [images]);

  const filteredImages = useMemo(() => {
    if (!deptFilter) return images;
    return images.filter(img => img.event_department === deptFilter);
  }, [images, deptFilter]);

  const showFilter = departments.length > 1;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredImages.map(img => img.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected image${selectedIds.size !== 1 ? "s" : ""}?`)) return;
    onBatchDelete?.(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  useEffect(() => {
    onSelectionChange?.(selectedIds.size);
  }, [selectedIds, onSelectionChange]);

  if (images.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🖼️</div>
        <p style={{ fontWeight: 500, marginBottom: 4 }}>No images uploaded yet</p>
        <p style={{ fontSize: "0.875rem" }}>Images uploaded to this event will appear here.</p>
      </div>
    );
  }

  return (
    <>
      {/* Batch delete toolbar */}
      {!hideToolbar && onBatchDelete && canDelete && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          {selectedIds.size > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-gov-muted)" }}>
                {selectedIds.size} selected
              </span>
              <button className="btn-outline btn-sm" onClick={deselectAll} style={{ fontSize: "0.75rem" }}>
                Deselect
              </button>
              <button className="btn-danger btn-sm" onClick={handleBatchDelete} style={{ fontSize: "0.75rem" }}>
                <Trash2 size={12} /> Delete Selected
              </button>
            </div>
          ) : (
            <button className="btn-outline btn-sm" onClick={selectAll} style={{ fontSize: "0.75rem" }}>
              <CheckSquare size={12} /> Select All
            </button>
          )}
        </div>
      )}

      {/* Department Filter */}
      {showFilter && (
        <div className="gallery-filter-bar">
          <div className="gallery-filter-label">
            <Filter size={14} />
            <span>Filter by department</span>
          </div>
          <div className="gallery-filter-pills">
            <button
              className={`gallery-filter-pill ${!deptFilter ? 'active' : ''}`}
              onClick={() => setDeptFilter("")}
            >
              All
              <span className="gallery-filter-pill-count">{images.length}</span>
            </button>
            {departments.map(dept => {
              const count = images.filter(img => img.event_department === dept).length;
              return (
                <button
                  key={dept}
                  className={`gallery-filter-pill ${deptFilter === dept ? 'active' : ''}`}
                  onClick={() => setDeptFilter(deptFilter === dept ? "" : dept)}
                >
                  {dept}
                  <span className="gallery-filter-pill-count">{count}</span>
                </button>
              );
            })}
          </div>
          {deptFilter && (
            <button
              className="gallery-filter-clear"
              onClick={() => setDeptFilter("")}
            >
              <X size={12} />
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Results Info */}
      {deptFilter && (
        <div className="gallery-filter-info">
          Showing <strong>{filteredImages.length}</strong> image{filteredImages.length !== 1 ? 's' : ''} from <strong>{deptFilter}</strong> department
        </div>
      )}

      <div className="gallery-grid">
        {filteredImages.map((img) => (
          <div key={img.id} className="gallery-item" style={{ background: "var(--color-gov-surface)" }}>
            <div
              style={{ position: "relative", paddingTop: "70%", cursor: "pointer", background: "#f8fafc" }}
            >
              <img
                src={`/uploads/${img.filename}`}
                alt={img.caption || "Event image"}
                onClick={() => setLightbox(img)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0)",
                  transition: "background 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
                className="gallery-hover-overlay"
              >
                <ZoomIn size={24} color="white" style={{ opacity: 0, transition: "opacity 0.2s ease" }} />
              </div>
              {img.event_department && showFilter && (
                <span className="gallery-item-dept-badge">
                  {img.event_department}
                </span>
              )}
              {/* Bottom info overlay */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "20px 10px 8px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
                pointerEvents: "none",
              }}>
                {img.caption && (
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "white", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {img.caption}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.65rem", color: "rgba(255,255,255,0.75)" }}>
                  {img.event_title && <span style={{ fontWeight: 600, color: "var(--color-gov-gold)" }}>{img.event_title}</span>}
                  <span>{img.uploader_name}</span>
                  <span>{new Date(img.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
              </div>
              {/* Selection checkbox */}
              {onBatchDelete && canDelete && (
                <div
                  style={{ position: "absolute", top: 6, left: 6, zIndex: 2 }}
                  onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
                >
                  {selectedIds.has(img.id) ? (
                    <div style={{ background: "var(--color-gov-navy)", borderRadius: 4, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <CheckSquare size={16} color="white" />
                    </div>
                  ) : (
                    <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 4, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Square size={14} color="white" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                {editingCaption === img.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); onCaptionEdit?.(img.id, editValue); setEditingCaption(null); }} style={{ display: "flex", gap: 4 }}>
                    <input
                      type="text"
                      className="form-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ fontSize: "0.8rem", padding: "4px 8px", width: 140 }}
                      autoFocus
                      maxLength={200}
                    />
                    <button type="submit" className="btn-primary btn-sm" style={{ padding: "4px 8px", fontSize: "0.7rem" }}>Save</button>
                    <button type="button" className="btn-outline btn-sm" style={{ padding: "4px 8px", fontSize: "0.7rem" }} onClick={() => setEditingCaption(null)}>Cancel</button>
                  </form>
                ) : canEditCaption ? (
                  <p
                    style={{ fontSize: "0.75rem", color: "var(--color-gov-muted)", cursor: "pointer" }}
                    onClick={() => { setEditingCaption(img.id); setEditValue(img.caption || ""); }}
                  >
                    {img.caption ? "✏️" : "+ Caption"}
                  </p>
                ) : null}
              </div>
              {canDelete && onDelete && !onBatchDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
                  style={{
                    padding: "4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-gov-danger)",
                    borderRadius: 4,
                    opacity: 0.6,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
            }}
          >
            <X size={20} />
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "90vw", height: "85vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <img
              src={`/uploads/${lightbox.filename}`}
              alt={lightbox.caption || ""}
              style={{ maxWidth: "100%", maxHeight: "calc(85vh - 40px)", borderRadius: 8, objectFit: "contain" }}
            />
            {(lightbox.caption || lightbox.event_department) && (
              <div style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 12, fontSize: "0.875rem" }}>
                {lightbox.caption}
                {lightbox.caption && lightbox.event_department && " · "}
                {lightbox.event_department && (
                  <span style={{ color: "var(--color-gov-gold)", fontWeight: 600 }}>{lightbox.event_department}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default ImageGallery;
