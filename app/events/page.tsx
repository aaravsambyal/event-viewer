"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Calendar, Users, User, ChevronDown, ChevronRight, ChevronLeft, Image as ImageIcon, MapPin, Sparkles, Search, Images, TreePine, X, LayoutPanelTop, FolderOpen, Filter, SortAsc, Trash2 } from "lucide-react";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

type ViewMode = "drill" | "images" | "tree";

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [allImages, setAllImages] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("drill");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [closingFilterYear, setClosingFilterYear] = useState("");
  const [closingFilterMonth, setClosingFilterMonth] = useState("");
  const [closingFilterDay, setClosingFilterDay] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [drillStack, setDrillStack] = useState<any[]>([null]);
  const [drillImages, setDrillImages] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [viewingImagesEventId, setViewingImagesEventId] = useState<number | null>(null);
  const [imagesPushedStack, setImagesPushedStack] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<any>(null);

  const [imagesSelectedMain, setImagesSelectedMain] = useState<number | null>(null);
  const [imagesSelectedSub, setImagesSelectedSub] = useState<number | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesDeptFilter, setImagesDeptFilter] = useState("");
  const [imagesSort, setImagesSort] = useState("newest");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1997 + 1 }, (_, i) => 1997 + i);
  }, []);

  useEffect(() => {
    fetch("/api/events", { credentials: "omit" }).then(r => r.json()).then(d => {
      if (d.events) setEvents(d.events);
      setTimeout(() => setLoaded(true), 100);
    });
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setCurrentUser(d.user));
  }, []);

  const departments = useMemo(() => {
    const depts = new Set<string>();
    events.forEach(e => { if (e.department) depts.add(e.department); });
    return Array.from(depts).sort();
  }, [events]);

  const countries = useMemo(() => {
    const c = new Set<string>();
    events.forEach(e => { if (e.country) c.add(e.country); });
    return Array.from(c).sort();
  }, [events]);

  const states = useMemo(() => {
    const s = new Set<string>();
    events.forEach(e => {
      if (e.state && (!countryFilter || e.country === countryFilter)) s.add(e.state);
    });
    return Array.from(s).sort();
  }, [events, countryFilter]);

  const districts = useMemo(() => {
    const d = new Set<string>();
    events.forEach(e => {
      if (e.district && (!countryFilter || e.country === countryFilter) && (!stateFilter || e.state === stateFilter)) d.add(e.district);
    });
    return Array.from(d).sort();
  }, [events, countryFilter, stateFilter]);

  const checkSingleDate = useCallback((dateStr: string | null | undefined, year: string, month: string, day: string): boolean => {
    if (!year && !month && !day) return true;
    if (!dateStr) return false;
    const cleanDate = dateStr.slice(0, 10);
    const parts = cleanDate.split("-");
    if (parts.length < 3) return false;

    const y = parts[0];
    const m = parts[1];
    const d = parts[2];

    if (year && y !== year) return false;
    if (month && m !== month) return false;
    if (day && d !== day.padStart(2, "0")) return false;

    return true;
  }, []);

  const checkDateMatch = useCallback((dateStr: string | null | undefined): boolean => {
    if (!filterYear && !filterMonth && !filterDay) return true;
    return checkSingleDate(dateStr, filterYear, filterMonth, filterDay);
  }, [filterYear, filterMonth, filterDay, checkSingleDate]);

  const checkEventDateMatch = useCallback((e: any): boolean => {
    const eventFilterActive = filterYear || filterMonth || filterDay;
    const closingFilterActive = closingFilterYear || closingFilterMonth || closingFilterDay;
    if (!eventFilterActive && !closingFilterActive) return true;
    const eventMatch = !eventFilterActive || checkSingleDate(e.event_date, filterYear, filterMonth, filterDay);
    const closingMatch = !closingFilterActive || checkSingleDate(e.closing_date, closingFilterYear, closingFilterMonth, closingFilterDay);
    return eventMatch && closingMatch;
  }, [filterYear, filterMonth, filterDay, closingFilterYear, closingFilterMonth, closingFilterDay, checkSingleDate]);

  const filtered = useMemo(() => {
    let result = [...events];
    const matchesFilter = (e: any) => {
      let match = true;
      if (deptFilter && e.department !== deptFilter) match = false;
      if (countryFilter && e.country !== countryFilter) match = false;
      if (stateFilter && e.state !== stateFilter) match = false;
      if (districtFilter && e.district !== districtFilter) match = false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!e.title?.toLowerCase().includes(q) && !e.department?.toLowerCase().includes(q) && !e.description?.toLowerCase().includes(q)) match = false;
      }
      if (!checkEventDateMatch(e)) match = false;
      return match;
    };
    const matchedEventIds = new Set<number>();
    events.forEach(e => { if (matchesFilter(e)) matchedEventIds.add(e.id); });
    const includeIds = new Set<number>();
    const includeWithParents = (id: number) => {
      if (includeIds.has(id)) return;
      const ev = events.find(e => e.id === id);
      if (!ev) return;
      includeIds.add(id);
      if (ev.parent_id) includeWithParents(ev.parent_id);
    };
    matchedEventIds.forEach(id => includeWithParents(id));
    result = events.filter(e => includeIds.has(e.id));
    result.sort((a, b) => {
      if (sort === "participants") return (b.participant_count || 0) - (a.participant_count || 0);
      if (sort === "images") return (b.image_count || 0) - (a.image_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [events, deptFilter, countryFilter, stateFilter, districtFilter, sort, searchQuery, checkEventDateMatch]);

  const mainEvents = filtered.filter(e => e.type === 'main');
  const subEvents = filtered.filter(e => e.type === 'sub');

  const getEventHierarchyImages = useCallback((eventId: number): number => {
    const getDescendants = (id: number): number[] => {
      const children = events.filter(e => e.parent_id === id);
      return children.reduce((acc: number[], child) => [...acc, child.id, ...getDescendants(child.id)], []);
    };
    const ids = [eventId, ...getDescendants(eventId)];
    return events.filter(e => ids.includes(e.id)).reduce((sum, e) => sum + (e.image_count || 0), 0);
  }, [events]);

  const getEventHierarchyParticipants = useCallback((eventId: number): number => {
    const getDescendants = (id: number): number[] => {
      const children = events.filter(e => e.parent_id === id);
      return children.reduce((acc: number[], child) => [...acc, child.id, ...getDescendants(child.id)], []);
    };
    const ids = [eventId, ...getDescendants(eventId)];
    return events.filter(e => ids.includes(e.id)).reduce((sum, e) => sum + (e.participant_count || 0), 0);
  }, [events]);

  const currentEventId = drillStack[drillStack.length - 1];
  const currentEvent = currentEventId ? events.find(e => e.id === currentEventId) : null;

  const drillChildren = useMemo(() => {
    if (!currentEventId) return [];
    return filtered.filter(e => e.parent_id === currentEventId);
  }, [filtered, currentEventId]);

  const filteredDrillImages = useMemo(() => {
    return drillImages.filter(img => checkDateMatch(img.uploaded_at));
  }, [drillImages, checkDateMatch]);

  const goToEvent = useCallback((id: number) => {
    setDrillStack(prev => [...prev, id]);
    setViewingImagesEventId(null);
    setImagesPushedStack(false);
    setDrillImages([]);
  }, []);

  const goBack = useCallback(() => {
    if (viewingImagesEventId !== null) {
      if (imagesPushedStack) {
        setDrillStack(prev => prev.slice(0, -1));
      }
      setViewingImagesEventId(null);
      setImagesPushedStack(false);
      setDrillImages([]);
      return;
    }

    if (drillStack.length <= 1) return;
    setDrillStack(prev => prev.slice(0, -1));
    setDrillImages([]);
  }, [drillStack, viewingImagesEventId, imagesPushedStack]);

  const goToImages = useCallback(async (eventId: number) => {
    setDrillLoading(true);
    setDrillStack(prev => {
      if (prev[prev.length - 1] === eventId) {
        setImagesPushedStack(false);
        return prev;
      }
      setImagesPushedStack(true);
      return [...prev, eventId];
    });
    setViewingImagesEventId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/images`, { credentials: "omit" });
      const data = await res.json();
      setDrillImages(data.images || []);
    } catch {
      setDrillImages([]);
    }
    setDrillLoading(false);
  }, []);

  const breadcrumbs = useMemo(() => {
    const crumbs: { id: number | null; label: string }[] = [{ id: null, label: "Events" }];
    for (let i = 1; i < drillStack.length; i++) {
      const ev = events.find(e => e.id === drillStack[i]);
      if (ev) crumbs.push({ id: ev.id, label: ev.title });
    }
    return crumbs;
  }, [drillStack, events]);

  const showDrillImages = viewingImagesEventId !== null || drillLoading;

  const canDeleteImage = useCallback((img: any) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (img.uploader_id === currentUser.id) return true;
    
    const ev = events.find(e => e.id === img.event_id);
    if (ev && ev.created_by_name === currentUser.name) return true;
    
    return false;
  }, [currentUser, events]);

  const handleDeleteImage = useCallback(async (imageId: number) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
        credentials: "omit"
      });
      if (res.ok) {
        setDrillImages(prev => prev.filter(img => img.id !== imageId));
        setImagesLoaded(prev => prev.filter(img => img.id !== imageId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete image");
      }
    } catch {
      alert("Error deleting image");
    }
  }, []);

  const loadEventImages = useCallback(async (eventId: number) => {
    setImagesLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/images`, { credentials: "omit" });
      const data = await res.json();
      setImagesLoaded(data.images || []);
    } catch {
      setImagesLoaded([]);
    }
    setImagesLoading(false);
  }, []);

  const handleSelectMainEvent = (id: number) => {
    if (imagesSelectedMain === id) {
      setImagesSelectedMain(null);
      setImagesSelectedSub(null);
      setImagesLoaded([]);
      setImagesDeptFilter("");
      return;
    }
    setImagesSelectedMain(id);
    setImagesSelectedSub(null);
    setImagesDeptFilter("");
    loadEventImages(id);
  };

  const handleSelectSubEvent = (id: number | null) => {
    setImagesSelectedSub(id);
  };

  const imagesBrowserSubTree = useMemo(() => {
    if (!imagesSelectedMain) return [];
    const buildWithDepth = (parentId: number, depth: number = 0): any[] => {
      const children = events.filter(e => e.parent_id === parentId);
      return children.reduce((acc: any[], child: any) => [
        ...acc,
        { ...child, depth },
        ...buildWithDepth(child.id, depth + 1)
      ], []);
    };
    return buildWithDepth(imagesSelectedMain);
  }, [events, imagesSelectedMain]);

  const imagesBrowserSubs = imagesBrowserSubTree;

  const imagesSelectedPath = useMemo(() => {
    if (!imagesSelectedMain) return [];
    if (!imagesSelectedSub) return [];
    const path: number[] = [];
    let currentId: number | null = imagesSelectedSub;
    while (currentId) {
      const ev = events.find(e => e.id === currentId);
      if (!ev) break;
      path.unshift(currentId);
      if (ev.parent_id === imagesSelectedMain || !ev.parent_id) {
        break;
      }
      currentId = ev.parent_id;
    }
    return path;
  }, [events, imagesSelectedMain, imagesSelectedSub]);

  const renderSubFilters = useCallback(() => {
    if (!imagesSelectedMain) return null;

    const sortChildren = (children: any[]): any[] => {
      const sorted = [...children];
      if (imagesSort === "participants") {
        sorted.sort((a, b) => (b.participant_count || 0) - (a.participant_count || 0));
      } else if (imagesSort === "images") {
        sorted.sort((a, b) => (b.image_count || 0) - (a.image_count || 0));
      } else {
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return sorted;
    };

    const hasMatchingDeptImages = (eventId: number): boolean => {
      if (!imagesDeptFilter) return true;
      const ev = events.find(e => e.id === eventId);
      if (ev && ev.department === imagesDeptFilter) return true;
      if (imagesLoaded.some(img => img.event_id === eventId && img.event_department === imagesDeptFilter)) return true;
      const children = events.filter(e => e.parent_id === eventId);
      return children.some(child => hasMatchingDeptImages(child.id));
    };

    const renderGroup = (parentId: number | null, depth: number = 0): React.ReactNode => {
      const targetParentId = parentId === null ? imagesSelectedMain : parentId;
      const rawChildren = events.filter(e => e.parent_id === targetParentId);
      const deptFiltered = imagesDeptFilter
        ? rawChildren.filter(sub => hasMatchingDeptImages(sub.id))
        : rawChildren;
      const children = sortChildren(deptFiltered);
      if (children.length === 0) return null;

      const activeChildId = imagesSelectedPath[depth] || null;
      const isLevelAllActive = (depth === 0 && imagesSelectedSub === null) || 
                              (depth > 0 && imagesSelectedSub === parentId);

      return (
        <div className={`images-browser-sub-group depth-${depth}`}>
          <button
            className={`images-browser-sub-pill ${isLevelAllActive ? 'active' : ''}`}
            onClick={() => {
              if (depth === 0) {
                handleSelectSubEvent(null);
              } else {
                handleSelectSubEvent(parentId);
              }
            }}
          >
            All
          </button>
          {children.map(sub => {
            const isActive = activeChildId === sub.id || imagesSelectedSub === sub.id;
            const hasSubEvents = events.some(e => e.parent_id === sub.id);

            return (
              <Fragment key={sub.id}>
                <button
                  className={`images-browser-sub-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectSubEvent(sub.id)}
                >
                  {sub.title}
                </button>
                {isActive && hasSubEvents && renderGroup(sub.id, depth + 1)}
              </Fragment>
            );
          })}
        </div>
      );
    };

    return renderGroup(null, 0);
  }, [events, imagesLoaded, imagesDeptFilter, imagesSelectedMain, imagesSelectedSub, imagesSelectedPath, imagesSort, handleSelectSubEvent]);

  const imagesBrowserDisplay = useMemo(() => {
    let result = imagesLoaded;
    if (imagesSelectedSub) {
      const getAllDescendantIds = (parentId: number): number[] => {
        const children = events.filter(e => e.parent_id === parentId);
        return children.reduce((acc: number[], child: any) => {
          return [...acc, child.id, ...getAllDescendantIds(child.id)];
        }, []);
      };
      const subIds = new Set([imagesSelectedSub, ...getAllDescendantIds(imagesSelectedSub)]);
      result = result.filter(img => subIds.has(img.event_id));
    }
    if (imagesDeptFilter) {
      result = result.filter(img => img.event_department === imagesDeptFilter);
    }
    result = result.filter(img => checkDateMatch(img.uploaded_at));
    result = [...result].sort((a, b) => {
      if (imagesSort === "participants") return (b.participant_count || 0) - (a.participant_count || 0);
      if (imagesSort === "images") return (b.image_count || 0) - (a.image_count || 0);
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    });
    return result;
  }, [imagesLoaded, imagesSelectedSub, events, imagesDeptFilter, imagesSort, checkDateMatch]);
  
  const treeData = useMemo(() => {
    const buildTree = (parentId: number | null): any[] => {
      return filtered.filter(e => e.parent_id === parentId).map(e => ({ ...e, children: buildTree(e.id) }));
    };
    
    const mains = filtered.filter(e => e.type === 'main');
    const mainTrees = mains.map(e => ({ ...e, children: buildTree(e.id) }));

    const subIds = new Set(filtered.map(e => e.id));
    const orphanedSubs = filtered.filter(e => e.type === 'sub' && (!e.parent_id || !subIds.has(e.parent_id)));
    const orphanedTrees = orphanedSubs.map(e => ({ ...e, children: buildTree(e.id) }));

    return [...mainTrees, ...orphanedTrees];
  }, [filtered]);

  const [treeExpanded, setTreeExpanded] = useState<Record<number, boolean>>({});
  useEffect(() => {
    if (viewMode !== "tree") return;
    const newExpanded: Record<number, boolean> = {};
    const expandAll = (nodes: any[]) => {
      nodes.forEach(n => {
        newExpanded[n.id] = true;
        if (n.children) expandAll(n.children);
      });
    };
    expandAll(treeData);
    setTreeExpanded(newExpanded);
  }, [treeData, viewMode]);

  const treeLoaded = loaded && viewMode === "tree";

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        
        {/* Header toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 850, color: "var(--color-gov-text)", letterSpacing: "-0.01em" }}>Events Portal</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--color-gov-muted)", marginTop: 2 }}>
              Explore structural hierarchy, dynamic image galleries, and event timeline audits.
            </p>
          </div>
          
          {/* View switcher */}
          <div style={{ display: "flex", background: "var(--color-gov-surface)", padding: 3, borderRadius: 8, border: "1px solid var(--color-gov-border)" }}>
            <button
              onClick={() => setViewMode("drill")}
              className={`view-mode-btn ${viewMode === "drill" ? "active" : ""}`}
              title="Drill-down layout"
            >
              <LayoutPanelTop size={14} />
              <span>Drill-down</span>
            </button>
            <button
              onClick={() => setViewMode("images")}
              className={`view-mode-btn ${viewMode === "images" ? "active" : ""}`}
              title="Images browser"
            >
              <Images size={14} />
              <span>Images</span>
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`view-mode-btn ${viewMode === "tree" ? "active" : ""}`}
              title="Tree hierarchy layout"
            >
              <TreePine size={14} />
              <span>Tree View</span>
            </button>
          </div>
        </div>

        {/* Global Filters bar */}
        <div className="gov-card" style={{ padding: "16px 20px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
              <input
                className="form-input"
                style={{ paddingLeft: 34, fontSize: "0.85rem" }}
                placeholder="Search event title, description…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Department Filter */}
            <div style={{ position: "relative", flex: "1 1 180px" }}>
              <Filter size={12} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
              <select
                className="form-input"
                style={{ paddingLeft: 32, fontSize: "0.85rem", appearance: "none" }}
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Sort */}
            <div style={{ position: "relative", flex: "1 1 160px" }}>
              <SortAsc size={12} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gov-muted)" }} />
              <select
                className="form-input"
                style={{ paddingLeft: 32, fontSize: "0.85rem", appearance: "none" }}
                value={sort}
                onChange={e => { setSort(e.target.value); setImagesSort(e.target.value); }}
              >
                <option value="newest">Sort: Newest</option>
                <option value="participants">Sort: Attendees</option>
                <option value="images">Sort: Image Count</option>
              </select>
            </div>
          </div>

          {/* Location & date drill downs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid var(--color-gov-border)", paddingTop: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: "1 1 auto" }}>
              <select className="form-input" style={{ width: 130, fontSize: "0.8rem", height: 32, padding: "0 8px" }} value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setStateFilter(""); setDistrictFilter(""); }}>
                <option value="">All Countries</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="form-input" style={{ width: 130, fontSize: "0.8rem", height: 32, padding: "0 8px" }} value={stateFilter} onChange={e => { setStateFilter(e.target.value); setDistrictFilter(""); }} disabled={!countryFilter}>
                <option value="">All States</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="form-input" style={{ width: 130, fontSize: "0.8rem", height: 32, padding: "0 8px" }} value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} disabled={!stateFilter}>
                <option value="">All Districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Event Timeline parameters */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gov-muted)" }}>Date:</span>
              <select className="form-input" style={{ width: 85, fontSize: "0.8rem", height: 32, padding: "0 4px" }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="">Year</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="form-input" style={{ width: 75, fontSize: "0.8rem", height: 32, padding: "0 4px" }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(m => (
                  <option key={m} value={m}>{new Date(2000, parseInt(m) - 1).toLocaleString("en-US", { month: "short" })}</option>
                ))}
              </select>
              <select className="form-input" style={{ width: 65, fontSize: "0.8rem", height: 32, padding: "0 4px" }} value={filterDay} onChange={e => setFilterDay(e.target.value)}>
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ===================== LAYOUT 1: DRILL DOWN LAYOUT ===================== */}
        {viewMode === "drill" && (
          <div className="drill-layout">
            
            {/* Breadcrumbs */}
            <div className="drill-breadcrumbs">
              {breadcrumbs.map((crumb, idx) => (
                <Fragment key={idx}>
                  {idx > 0 && <span className="drill-breadcrumbs-separator">/</span>}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="drill-breadcrumb active">{crumb.label}</span>
                  ) : (
                    <button
                      className="drill-breadcrumb-btn"
                      onClick={() => {
                        const targetIdx = drillStack.indexOf(crumb.id);
                        if (targetIdx !== -1) {
                          setDrillStack(prev => prev.slice(0, targetIdx + 1));
                          setViewingImagesEventId(null);
                          setImagesPushedStack(false);
                          setDrillImages([]);
                        }
                      }}
                    >
                      {crumb.label}
                    </button>
                  )}
                </Fragment>
              ))}
            </div>

            {/* Back action */}
            {drillStack.length > 1 && (
              <button className="drill-back-btn" onClick={goBack}>
                <ChevronLeft size={16} />
                <span>Go Back</span>
              </button>
            )}

            {showDrillImages && (
              <div className="drill-images-container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 750, color: "var(--color-gov-text)" }}>
                    Event Gallery {currentEvent && `— ${currentEvent.title}`}
                  </h2>
                </div>
                
                {drillLoading ? (
                  <div className="drill-loading">Loading event archive images...</div>
                ) : filteredDrillImages.length === 0 ? (
                  <div className="events-empty" style={{ padding: "40px 24px" }}>
                    <div className="events-empty-icon"><ImageIcon size={32} /></div>
                    <p className="events-empty-title">No Images</p>
                    <p className="events-empty-subtitle">No images match the current timeline.</p>
                  </div>
                ) : (
                  <div className="drill-images-grid">
                    {filteredDrillImages.map((img: any) => (
                      <div key={img.id} className="drill-image-card" style={{ position: "relative", cursor: "pointer" }} onClick={() => setLightboxImage(img)}>
                        <div className="drill-image-wrap">
                          <img src={`/uploads/${img.filename}`} alt={img.caption || ""} />
                        </div>
                        <div className="image-card-footer" style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTop: "none", background: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.85))", padding: "8px 10px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {img.caption && (
                              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                                {img.caption}
                              </div>
                            )}
                            <div className="image-card-meta-rows">
                              <div className="image-card-meta-row">
                                <User size={11} className="image-card-meta-icon" />
                                <span style={{ color: "rgba(255,255,255,0.85)" }}>{img.uploader_name}</span>
                              </div>
                              <div className="image-card-meta-row">
                                <Calendar size={11} className="image-card-meta-icon" />
                                <span style={{ color: "rgba(255,255,255,0.85)" }}>
                                  {mounted ? new Date(img.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {canDeleteImage(img) && (
                            <button className="image-card-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }} title="Delete image" style={{ color: "white", width: 24, height: 24, flexShrink: 0, marginLeft: 8 }}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!showDrillImages && (
              <>
                {currentEventId === null ? (
                  mainEvents.length === 0 ? (
                    <div className="events-empty">
                      <div className="events-empty-icon"><Calendar size={32} /></div>
                      <p className="events-empty-title">No Events Found</p>
                      <p className="events-empty-subtitle">{deptFilter || searchQuery ? "Try adjusting your filters." : "Check back soon."}</p>
                    </div>
                  ) : (
                    <div className="drill-main-grid">
                      {mainEvents.map((ev: any, i: number) => (
                        <div
                          key={ev.id}
                          className={`drill-card ${loaded ? 'visible' : ''}`}
                          style={{ animationDelay: `${i * 60}ms` }}
                          onClick={() => goToEvent(ev.id)}
                        >
                          <div className="drill-card-image">
                            {ev.preview_image ? (
                              <img src={`/uploads/${ev.preview_image}`} alt={ev.title} />
                            ) : (
                              <div className="drill-card-placeholder"><ImageIcon size={36} /></div>
                            )}
                            <div className="drill-card-overlay" />
                            {ev.department && <span className="drill-card-dept">{ev.department}</span>}
                            {getEventHierarchyImages(ev.id) > 0 && (
                              <span className="drill-card-count"><ImageIcon size={11} />{getEventHierarchyImages(ev.id)}</span>
                            )}
                            <div className="drill-card-click-hint">
                              <span>View Sub-Events</span>
                              <ChevronRight size={14} />
                            </div>
                          </div>
                          <div className="drill-card-body">
                            <h2 className="drill-card-title">{ev.title}</h2>
                             <div className="drill-card-meta">
                               <span>
                                 <Calendar size={12} />
                                 {mounted && ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                               </span>
                               {ev.closing_date && (
                                 <span style={{ color: ev.status === "closed" ? "var(--color-gov-danger, #ef4444)" : "var(--color-gov-gold, #e5c07b)" }}>
                                   <Calendar size={12} />
                                   {mounted ? (
                                     <>
                                       {ev.status === "closed" ? "Closed: " : "Closes: "}
                                       {new Date(ev.closing_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                     </>
                                   ) : "—"}
                                 </span>
                               )}
                               <span>
                                 <MapPin size={12} />
                                 {ev.location || "—"}
                               </span>
                               <span>
                                 <Images size={12} />
                                 {getEventHierarchyImages(ev.id)} image{getEventHierarchyImages(ev.id) !== 1 ? "s" : ""}
                               </span>
                               <span>
                                 <Users size={12} />
                                 {getEventHierarchyParticipants(ev.id)} participant{getEventHierarchyParticipants(ev.id) !== 1 ? "s" : ""}
                               </span>
                             </div>
                            {ev.description && <p className="drill-card-desc">{ev.description}</p>}
                          </div>
                          <div className="drill-card-footer">
                            <span className="drill-card-subs">
                              {subEvents.filter(s => s.parent_id === ev.id).length} sub-event{subEvents.filter(s => s.parent_id === ev.id).length !== 1 ? "s" : ""}
                            </span>
                            <button className="drill-card-view-btn">Explore →</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  drillChildren.length === 0 ? (
                    <div className="events-empty">
                      <div className="events-empty-icon"><Calendar size={32} /></div>
                      <p className="events-empty-title">No Sub-Events</p>
                      <p className="events-empty-subtitle">This event has no sub-events.</p>
                      {currentEvent && (
                        <button className="drill-view-images-btn" onClick={() => goToImages(currentEvent.id)}>
                          <ImageIcon size={14} />
                          View Images
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {currentEvent && (
                        <div className="drill-context-header">
                          <FolderOpen size={16} />
                          <span>{currentEvent.title}</span>
                          <button className="drill-view-images-btn" onClick={() => goToImages(currentEvent.id)}>
                            <ImageIcon size={14} />
                            View Images
                          </button>
                        </div>
                      )}
                      <div className="drill-sub-grid">
                        {drillChildren.map((ev: any, i: number) => (
                          <div
                            key={ev.id}
                            className={`drill-sub-card ${loaded ? 'visible' : ''}`}
                            style={{ animationDelay: `${i * 50}ms` }}
                          >
                            <div className="drill-sub-card-top" onClick={() => goToEvent(ev.id)}>
                              {ev.preview_image ? (
                                <img src={`/uploads/${ev.preview_image}`} alt={ev.title} className="drill-sub-thumb" />
                              ) : (
                                <div className="drill-sub-thumb-placeholder"><ImageIcon size={24} /></div>
                              )}
                              <div className="drill-sub-info">
                                <h3 className="drill-sub-title">{ev.title}</h3>
                                <div className="drill-sub-meta" style={{ flexWrap: "wrap", gap: "4px 8px" }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <Calendar size={10} />
                                    {mounted && ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                  </span>
                                  {ev.closing_date && (
                                    <span style={{ 
                                      display: "inline-flex", 
                                      alignItems: "center", 
                                      gap: 3, 
                                      color: ev.status === "closed" ? "var(--color-gov-danger, #ef4444)" : "var(--color-gov-gold, #e5c07b)" 
                                    }}>
                                      <Calendar size={10} />
                                      {mounted ? (
                                        <>
                                          {ev.status === "closed" ? "Closed: " : "Closes: "}
                                          {new Date(ev.closing_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                        </>
                                      ) : "—"}
                                    </span>
                                  )}
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <MapPin size={10} />
                                    {ev.location || "—"}
                                  </span>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <Images size={10} />
                                    {getEventHierarchyImages(ev.id)} img
