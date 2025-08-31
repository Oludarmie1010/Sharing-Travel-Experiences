import { useMemo, useState } from "react";
import { useStories } from "../store/stories.js";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar.jsx";
import "../styles/bookmarks.css";

export default function BookmarksPage() {
  const { stories, bookmarks, toggleBookmark } = useStories();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [filterMood, setFilterMood] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const items = useMemo(() => {
    const set = new Set(bookmarks);
    return stories.filter((s) => set.has(s.id));
  }, [stories, bookmarks]);

  // Facets
  const moods = useMemo(
    () => [...new Set(items.map((s) => s.mood).filter(Boolean))],
    [items]
  );
  const locations = useMemo(
    () => [...new Set(items.map((s) => s.location).filter(Boolean))],
    [items]
  );
  const tags = useMemo(
    () => [...new Set(items.flatMap((s) => s.tags || []).filter(Boolean))],
    [items]
  );

  // Filtering
  const filteredItems = useMemo(() => {
    let list = items;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter((s) => {
        const tagText = (s.tags || []).join(" ");
        return `${s.title} ${s.body} ${s.mood || ""} ${s.location || ""} ${tagText}`
          .toLowerCase()
          .includes(q);
      });
    }
    if (filterMood) list = list.filter((s) => s.mood === filterMood);
    if (filterLocation) list = list.filter((s) => s.location === filterLocation);
    if (filterTag) list = list.filter((s) => (s.tags || []).includes(filterTag));
    return list;
  }, [items, query, filterMood, filterLocation, filterTag]);

  function clearFilters() {
    setQuery("");
    setFilterMood("");
    setFilterLocation("");
    setFilterTag("");
  }

  return (
    <section className="card bookmarks">
      <h2 className="bookmarks__title">Bookmarks</h2>
      <p className="meta bookmarks__subtitle">
        Your saved stories. Bookmarks are private to you.
      </p>

      {/* Search */}
      <SearchBar
        query={query}
        onChange={setQuery}
        placeholder="Search your bookmarks by title, mood, location, or tag…"
      />

      {/* Filters */}
      <div className="row bookmarks__filters">
        <select
          className="select"
          value={filterMood}
          onChange={(e) => setFilterMood(e.target.value)}
          aria-label="Filter by mood"
        >
          <option value="">All moods</option>
          {moods.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          className="select"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          aria-label="Filter by location"
        >
          <option value="">All locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        <select
          className="select"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button className="btn" onClick={clearFilters}>Clear filters</button>
      </div>

      {/* Results */}
      <p className="meta bookmarks__count">
        {filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}
      </p>

      <ul className="reset feed">
        {filteredItems.length === 0 && (
          <p className="meta">No matching bookmarks.</p>
        )}

        {filteredItems.map((s) => (
          <li
            key={s.id}
            className="card clickable story-card"
            onClick={() => navigate(`/story/${s.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/story/${s.id}`);
              }
            }}
            tabIndex={0}
            aria-label={`Open bookmarked story: ${s.title || "untitled"}`}
          >
            <div className="meta story-meta">
              {new Date(s.createdAt).toLocaleDateString()} • {s.visibility} • {s.mood || "—"} • {s.location || "—"}
            </div>

            {s.images?.length > 0 && (
              <img
                src={s.images[0]}
                alt="bookmark thumbnail"
                className="story-img"
              />
            )}

            <h3 className="story-title">{s.title || "(untitled)"}</h3>
            <p className="story-preview">
              {s.body.slice(0, 180)}
              {s.body.length > 180 ? "…" : ""}
            </p>

            {s.tags?.length > 0 && (
              <p className="meta story-tags">Tags: {s.tags.join(", ")}</p>
            )}

            <div
              className="row story-actions"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn"
                onClick={() => navigate(`/story/${s.id}`)}
              >
                Open
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => toggleBookmark(s.id)}
                title="Remove from bookmarks"
              >
                ✕ Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
