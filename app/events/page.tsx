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

  // Check if event matches date filter on event_date and/or closing_date
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

  // Layout 1: Drill-down
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

  // Layout 2: Images
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

    // Check if a sub-event or any of its descendants has images in the filtered dept
    const hasMatchingDeptImages = (eventId: number): boolean => {
      if (!imagesDeptFilter) return true;
      const ev = events.find(e => e.id === eventId);
      if (ev && ev.department === imagesDeptFilter) return true;
      // Check loaded images for this event
      if (imagesLoaded.some(img => img.event_id === eventId && img.event_department === imagesDeptFilter)) return true;
      // Recurse into children
      const children = events.filter(e => e.parent_id === eventId);
      return children.some(child => hasMatchingDeptImages(child.id));
    };

    const renderGroup = (parentId: number | null, depth: number = 0): React.ReactNode => {
      const targetParentId = parentId === null ? imagesSelectedMain : parentId;
      const rawChildren = events.filter(e => e.parent_id === targetParentId);
      // Filter by dept if active — only show sub-events relevant to selected dept
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
  
  // Layout 3: Tree
  const treeData = useMemo(() => {
    const buildTree = (parentId: number | null): any[] => {
      return filtered.filter(e => e.parent_id === parentId).map(e => ({ ...e, children: buildTree(e.id) }));
    };
    return filtered.filter(e => e.type === 'main').map(e => ({ ...e, children: buildTree(e.id) }));
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
  }, [viewMode, treeData]);

  const [treeLoaded, setTreeLoaded] = useState(false);
  useEffect(() => {
    if (treeData.length > 0) setTreeLoaded(true);
  }, [treeData]);

  if (!mounted) {
    return (
      <>
        <Navbar />
        <main className="events-page"><div className="events-hero" /></main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="events-hero">
        <div className="events-hero-bg" />
        <div className="events-hero-content">
          <div className="events-hero-text">
            <div className="events-hero-badge">
              <Sparkles size={12} />
              <span>
                {viewMode === "drill" ? "Drill Down" : viewMode === "images" ? "Images" : "Tree"}
              </span>
            </div>
            <h1 className="events-hero-title">
              {viewMode === "drill"
                ? (currentEvent ? currentEvent.title : "Event Gallery")
                : viewMode === "images"
                ? "Image Gallery"
                : "Tree View"}
            </h1>
            <p className="events-hero-subtitle">
              {viewMode === "drill" && (
                showDrillImages
                  ? `${drillImages.length} image${drillImages.length !== 1 ? "s" : ""}`
                  : currentEventId
                  ? `${drillChildren.length} sub-event${drillChildren.length !== 1 ? "s" : ""}`
                  : `${mainEvents.length} event${mainEvents.length !== 1 ? "s" : ""}`
              )}
              {viewMode === "images" && (
                imagesSelectedMain
                  ? `${imagesBrowserDisplay.length} image${imagesBrowserDisplay.length !== 1 ? "s" : ""}`
                  : `${mainEvents.length} event${mainEvents.length !== 1 ? "s" : ""}`
              )}
              {viewMode === "tree" && `${filtered.length} event${filtered.length !== 1 ? "s" : ""} in hierarchy`}
            </p>
          </div>

          {/* Controls */}
          <div className="events-controls">
            <div className="events-controls-top">
              <div className="events-search-wrapper">
                <Search size={15} className="events-search-icon" />
                <input
                  type="text"
                  placeholder={viewMode === "images" ? "Search events..." : "Search events..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="events-search-input"
                />
              </div>
              <div className="events-view-toggle">
                <button className={`events-view-btn ${viewMode === 'drill' ? 'active' : ''}`} onClick={() => {
                  setViewMode('drill');
                  setDrillImages([]);
                  setViewingImagesEventId(null);
                  setImagesPushedStack(false);
                }} title="Drill-down view">
                  <LayoutPanelTop size={15} />
                </button>
                <button className={`events-view-btn ${viewMode === 'images' ? 'active' : ''}`} onClick={() => setViewMode('images')} title="Images browser">
                  <Images size={15} />
                </button>
                <button className={`events-view-btn ${viewMode === 'tree' ? 'active' : ''}`} onClick={() => setViewMode('tree')} title="Tree view">
                  <TreePine size={15} />
                </button>
              </div>
            </div>
            <div className="events-filters">
              <div className="events-filters-row events-filters-dates">
                <div className="events-filter-group">
                  <span className="events-filter-label">Event Date:</span>
                  <select
                    className="events-select"
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    {yearOptions.map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                  <select
                    className="events-select"
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                  >
                    <option value="">All Months</option>
                    {[
                      { val: "01", name: "January" },
                      { val: "02", name: "February" },
                      { val: "03", name: "March" },
                      { val: "04", name: "April" },
                      { val: "05", name: "May" },
                      { val: "06", name: "June" },
                      { val: "07", name: "July" },
                      { val: "08", name: "August" },
                      { val: "09", name: "September" },
                      { val: "10", name: "October" },
                      { val: "11", name: "November" },
                      { val: "12", name: "December" }
                    ].map(m => (
                      <option key={m.val} value={m.val}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    className="events-select"
                    value={filterDay}
                    onChange={e => setFilterDay(e.target.value)}
                  >
                    <option value="">All Days</option>
                    {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0")).map(d => (
                      <option key={d} value={d}>{parseInt(d)}</option>
                    ))}
                  </select>
                  {(filterYear || filterMonth || filterDay) && (
                    <button
                      onClick={() => { setFilterYear(""); setFilterMonth(""); setFilterDay(""); }}
                      className="timeline-clear-btn"
                      title="Clear event date filters"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className="events-filter-group">
                  <span className="events-filter-label">Closing:</span>
                  <select
                    className="events-select"
                    value={closingFilterYear}
                    onChange={e => setClosingFilterYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    {yearOptions.map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                  <select
                    className="events-select"
                    value={closingFilterMonth}
                    onChange={e => setClosingFilterMonth(e.target.value)}
                  >
                    <option value="">All Months</option>
                    {[
                      { val: "01", name: "January" },
                      { val: "02", name: "February" },
                      { val: "03", name: "March" },
                      { val: "04", name: "April" },
                      { val: "05", name: "May" },
                      { val: "06", name: "June" },
                      { val: "07", name: "July" },
                      { val: "08", name: "August" },
                      { val: "09", name: "September" },
                      { val: "10", name: "October" },
                      { val: "11", name: "November" },
                      { val: "12", name: "December" }
                    ].map(m => (
                      <option key={m.val} value={m.val}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    className="events-select"
                    value={closingFilterDay}
                    onChange={e => setClosingFilterDay(e.target.value)}
                  >
                    <option value="">All Days</option>
                    {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0")).map(d => (
                      <option key={d} value={d}>{parseInt(d)}</option>
                    ))}
                  </select>
                  {(closingFilterYear || closingFilterMonth || closingFilterDay) && (
                    <button
                      onClick={() => { setClosingFilterYear(""); setClosingFilterMonth(""); setClosingFilterDay(""); }}
                      className="timeline-clear-btn"
                      title="Clear closing date filters"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              {viewMode === "images" ? (
                <>
                  <div className="events-filters-row">
                    <span className="events-filter-label">Location:</span>
                    <select className="events-select" value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setStateFilter(""); setDistrictFilter(""); }}>
                      <option value="">All Countries</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="events-select" value={stateFilter} onChange={e => { setStateFilter(e.target.value); setDistrictFilter(""); }}>
                      <option value="">All States</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="events-select" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
                      <option value="">All Districts</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="events-filters-row">
                    <span className="events-filter-label">Dept:</span>
                    <select className="events-select" value={imagesDeptFilter} onChange={e => setImagesDeptFilter(e.target.value)}>
                      <option value="">All</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span className="events-filter-label">Sort:</span>
                    <select className="events-select" value={imagesSort} onChange={e => setImagesSort(e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="participants">Most Participants</option>
                      <option value="images">Most Images</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="events-filters-row">
                    <span className="events-filter-label">Location:</span>
                    <select className="events-select" value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setStateFilter(""); setDistrictFilter(""); }}>
                      <option value="">All Countries</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="events-select" value={stateFilter} onChange={e => { setStateFilter(e.target.value); setDistrictFilter(""); }}>
                      <option value="">All States</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="events-select" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
                      <option value="">All Districts</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="events-filters-row">
                    <span className="events-filter-label">Dept:</span>
                    <select className="events-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                      <option value="">All</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span className="events-filter-label">Sort:</span>
                    <select className="events-select" value={sort} onChange={e => setSort(e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="participants">Most Participants</option>
                      <option value="images">Most Images</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="events-main">
        {/* ===================== LAYOUT 1: DRILL-DOWN ===================== */}
        {viewMode === "drill" && (
          <>
            {drillStack.length > 1 && (
              <div className="drill-breadcrumb">
                <button onClick={goBack} className="drill-back-btn">
                  <ChevronLeft size={16} />
                  Back
                </button>
                <div className="drill-breadcrumb-trail">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={crumb.id ?? "root"} className="drill-crumb">
                      {i > 0 && <ChevronRight size={12} className="drill-crumb-sep" />}
                      {i < breadcrumbs.length - 1 ? (
                        <button className="drill-crumb-link" onClick={() => {
                          setDrillStack(prev => prev.slice(0, i + 1));
                          setDrillImages([]);
                          setViewingImagesEventId(null);
                          setImagesPushedStack(false);
                        }}>
                          {crumb.label}
                        </button>
                      ) : (
                        viewingImagesEventId !== null ? (
                          <button className="drill-crumb-link" onClick={() => {
                            setViewingImagesEventId(null);
                            setImagesPushedStack(false);
                            setDrillImages([]);
                          }}>
                            {crumb.label}
                          </button>
                        ) : (
                          <span className="drill-crumb-current">{crumb.label}</span>
                        )
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {showDrillImages && (
              <div className="drill-images-section">
                {currentEvent && (
                  <div className="drill-context-header">
                    <FolderOpen size={16} />
                    <span>{currentEvent.title} — Images</span>
                  </div>
                )}
                {drillLoading ? (
                  <div className="drill-loading">Loading images...</div>
                ) : filteredDrillImages.length === 0 ? (
                  <div className="events-empty">
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
                                <span style={{ color: "rgba(255,255,255,0.85)" }}>{new Date(img.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
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
                                 {ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                               </span>
                               {ev.closing_date && (
                                 <span style={{ color: ev.status === "closed" ? "var(--color-gov-danger, #ef4444)" : "var(--color-gov-gold, #e5c07b)" }}>
                                   <Calendar size={12} />
                                   {ev.status === "closed" ? "Closed: " : "Closes: "}
                                   {new Date(ev.closing_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
                                    {ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                  </span>
                                  {ev.closing_date && (
                                    <span style={{ 
                                      display: "inline-flex", 
                                      alignItems: "center", 
                                      gap: 3, 
                                      color: ev.status === "closed" ? "var(--color-gov-danger, #ef4444)" : "var(--color-gov-gold, #e5c07b)" 
                                    }}>
                                      <Calendar size={10} />
                                      {ev.status === "closed" ? "Closed: " : "Closes: "}
                                      {new Date(ev.closing_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                    </span>
                                  )}
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <MapPin size={10} />
                                    {ev.location || "—"}
                                  </span>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <Images size={10} />
                                    {getEventHierarchyImages(ev.id)} img
                                  </span>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <Users size={10} />
                                    {getEventHierarchyParticipants(ev.id)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {ev.image_count > 0 && (
                              <button className="drill-sub-images-btn" onClick={(e) => { e.stopPropagation(); goToImages(ev.id); }}>
                                <ImageIcon size={12} />
                                View Images
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )
                )}
              </>
            )}
          </>
        )}

        {/* ===================== LAYOUT 2: IMAGES BROWSER ===================== */}
        {viewMode === "images" && (
          <div className="images-browser">
            {/* Main events list (clickable pills/cards) */}
            {mainEvents.length === 0 ? (
              <div className="events-empty">
                <div className="events-empty-icon"><ImageIcon size={32} /></div>
                <p className="events-empty-title">No Events Found</p>
                <p className="events-empty-subtitle">{deptFilter || searchQuery ? "Try adjusting your filters." : "Check back soon."}</p>
              </div>
            ) : (
              <>
                <div className="images-browser-main-list">
                  {mainEvents.map(ev => (
                    <button
                      key={ev.id}
                      className={`images-browser-main-btn ${imagesSelectedMain === ev.id ? 'active' : ''}`}
                      onClick={() => handleSelectMainEvent(ev.id)}
                    >
                      {ev.preview_image ? (
                        <img src={`/uploads/${ev.preview_image}`} alt="" className="images-browser-main-thumb" />
                      ) : (
                        <div className="images-browser-main-thumb-placeholder"><ImageIcon size={14} /></div>
                      )}
                      <span className="images-browser-main-title">{ev.title}</span>
                      {getEventHierarchyImages(ev.id) > 0 && <span className="images-browser-main-count">{getEventHierarchyImages(ev.id)}</span>}
                    </button>
                  ))}
                </div>

                {imagesSelectedMain && (
                  <div className="images-browser-content">
                    {/* Sub-event filter pills (nested inline) */}
                    {events.some(e => e.parent_id === imagesSelectedMain) && (
                      <div className="images-browser-sub-filters-container">
                        <span className="images-browser-sub-level-label">Sub-Events:</span>
                        {renderSubFilters()}
                      </div>
                    )}

                    {/* Images grid */}
                    {imagesLoading ? (
                      <div className="drill-loading">Loading images...</div>
                    ) : imagesBrowserDisplay.length === 0 ? (
                      <div className="events-empty">
                        <div className="events-empty-icon"><ImageIcon size={32} /></div>
                        <p className="events-empty-title">No Images</p>
                        <p className="events-empty-subtitle">
                          {imagesSelectedSub ? "This sub-event has no images." : "This event has no images yet."}
                        </p>
                      </div>
                    ) : (
                      <div className="images-browser-grid">
                        {imagesBrowserDisplay.map((img: any) => (
                          <div key={img.id} className="images-browser-card" style={{ cursor: "pointer" }} onClick={() => setLightboxImage(img)}>
                            <div className="images-browser-image-wrap">
                              <img src={`/uploads/${img.filename}`} alt={img.caption || ""} />
                              {img.event_department && <span className="images-browser-dept">{img.event_department}</span>}
                            </div>
                            <div className="images-browser-info" style={{ paddingBottom: 0 }}>
                              <p className="images-browser-event-title">{img.event_title}</p>
                            </div>
                            <div className="image-card-footer">
                              <div className="image-card-meta-rows">
                                <div className="image-card-meta-row">
                                  <User size={12} className="image-card-meta-icon" />
                                  <span>{img.uploader_name}</span>
                                </div>
                                <div className="image-card-meta-row">
                                  <Calendar size={12} className="image-card-meta-icon" />
                                  <span>{new Date(img.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                </div>
                              </div>
                              {canDeleteImage(img) && (
                                <button className="image-card-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }} title="Delete image">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}  
                      </div>
                    )}
                  </div>
                )}

                {!imagesSelectedMain && (
                  <div className="events-empty" style={{ marginTop: 20, borderStyle: "dashed" }}>
                    <div className="events-empty-icon"><FolderOpen size={32} /></div>
                    <p className="events-empty-title">Select an Event</p>
                    <p className="events-empty-subtitle">Click on an event above to view its images.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===================== LAYOUT 3: TREE VIEW ===================== */}
        {viewMode === "tree" && (
          <>
            {treeData.length === 0 ? (
              <div className="events-empty">
                <div className="events-empty-icon"><TreePine size={32} /></div>
                <p className="events-empty-title">No Events Found</p>
                <p className="events-empty-subtitle">{deptFilter || searchQuery ? "Try adjusting your filters." : "Check back soon."}</p>
              </div>
            ) : (
              <div className="tree-view-container">
                <table className="tree-table">
                  <thead>
                    <tr className="tree-ascii-header">
                      <th className="tree-th tree-th-name">Event</th>
                      <th className="tree-th tree-th-date">Date</th>
                      <th className="tree-th tree-th-loc">Location</th>
                      <th className="tree-th tree-th-img">Images</th>
                      <th className="tree-th tree-th-ppl">Participants</th>
                      <th className="tree-th tree-th-closing">Closing</th>
                      <th className="tree-th tree-th-dept">Dept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treeData.map((node: any, i: number) => (
                      <TreeNode
                        key={node.id}
                        node={node}
                        expanded={treeExpanded}
                        onToggle={(id) => setTreeExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
                        depth={0}
                        loaded={treeLoaded}
                        prefix=""
                        isLast={i === treeData.length - 1}
                        getHierarchyImages={getEventHierarchyImages}
                        getHierarchyParticipants={getEventHierarchyParticipants}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="lightbox" onClick={() => setLightboxImage(null)}>
          <button
            onClick={() => setLightboxImage(null)}
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
          <div onClick={(e) => e.stopPropagation()} style={{ width: "90vw", height: "85vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <img
              src={`/uploads/${lightboxImage.filename}`}
              alt={lightboxImage.caption || ""}
              style={{ maxWidth: "100%", maxHeight: "calc(85vh - 40px)", borderRadius: 8, objectFit: "contain" }}
            />
            {(lightboxImage.caption || lightboxImage.event_department) && (
              <div style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 12, fontSize: "0.875rem" }}>
                {lightboxImage.caption}
                {lightboxImage.caption && lightboxImage.event_department && " · "}
                {lightboxImage.event_department && (
                  <span style={{ color: "var(--color-gov-gold)", fontWeight: 600 }}>{lightboxImage.event_department}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ============================
   TREE NODE COMPONENT (ASCII)
   ============================ */
function TreeNode({ node, expanded, onToggle, depth, loaded, prefix = "", isLast = false, getHierarchyImages, getHierarchyParticipants }: {
  node: any; expanded: Record<number, boolean>; onToggle: (id: number) => void;
  depth: number; loaded: boolean; prefix?: string; isLast?: boolean;
  getHierarchyImages?: (id: number) => number;
  getHierarchyParticipants?: (id: number) => number;
}) {
  const isExpanded = expanded[node.id] ?? false;
  const hasChildren = node.children && node.children.length > 0;
  const connector = isLast ? "└── " : "├── ";
  const childPrefix = prefix + (isLast ? "    " : "│   ");

  const loc = [node.district, node.state, node.country].filter(Boolean).join(", ");

  const dateStr = node.event_date
    ? new Date(node.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "-";
  const locStr = loc || "-";
  const hierarchyImgs = getHierarchyImages ? getHierarchyImages(node.id) : node.image_count;
  const hierarchyPpl = getHierarchyParticipants ? getHierarchyParticipants(node.id) : node.participant_count;
  const imgStr = hierarchyImgs > 0 ? `${node.image_count} (${hierarchyImgs})` : "-";
  const pplStr = (node.participant_count > 0 || hierarchyPpl > 0) ? `${node.participant_count || 0} (${hierarchyPpl})` : "-";
  const closingStr = node.closing_date
    ? (
      <span style={{ color: node.status === "closed" ? "var(--color-gov-danger, #ef4444)" : "var(--color-gov-gold, #e5c07b)" }}>
        {node.status === "closed" ? "Closed: " : "Closes: "}
        {new Date(node.closing_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
    )
    : <span>-</span>;

  return (
    <>
      <tr className={`tree-ascii-row ${loaded ? 'visible' : ''}`} style={{ cursor: "pointer", animationDelay: `${depth * 40}ms` }} onClick={() => window.location.href = `/events/${node.id}`}>
        <td className="tree-td tree-td-name">
          <span className="tree-ascii-prefix">{prefix}</span>
          <span className="tree-ascii-connector">
            {hasChildren ? (
              <button
                className="tree-ascii-toggle"
                onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {connector}{isExpanded ? "▼ " : "▶ "}
              </button>
            ) : (
              <span className="tree-ascii-leaf">{connector}</span>
            )}
          </span>
          <span className="tree-ascii-icon">
            {hasChildren ? "📁" : "📄"}
          </span>
          <span className="tree-ascii-name">{node.title}</span>
        </td>
        <td className="tree-td tree-td-date">{dateStr}</td>
        <td className="tree-td tree-td-loc">{locStr}</td>
        <td className="tree-td tree-td-img">{imgStr}</td>
        <td className="tree-td tree-td-ppl">{pplStr}</td>
        <td className="tree-td tree-td-closing">{closingStr}</td>
        <td className="tree-td tree-td-dept">{node.department ? <span className="tree-ascii-dept">{node.department}</span> : <span className="tree-ascii-dept" style={{ opacity: 0.3 }}>-</span>}</td>
      </tr>
      {hasChildren && isExpanded && (
        node.children.map((child: any, i: number) => (
          <TreeNode
            key={child.id}
            node={child}
            expanded={expanded}
            onToggle={onToggle}
            depth={depth + 1}
            loaded={loaded}
            prefix={childPrefix}
            isLast={i === node.children.length - 1}
            getHierarchyImages={getHierarchyImages}
            getHierarchyParticipants={getHierarchyParticipants}
          />
        ))
      )}
    </>
  );
}
