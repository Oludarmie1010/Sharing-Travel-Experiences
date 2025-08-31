import { useMemo, useState } from "react";
import { useStories } from "../store/stories.js";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar.jsx";
import '../styles/discover.css'

export default function DiscoverPage() {
  const { stories, bookmarks, toggleBookmark } = useStories();
  const navigate = useNavigate();

  // Query + filters
  const [query, setQuery] = useState("");
  const [filterMood, setFilterMood] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterTag, setFilterTag] = useState("");

  // Public-only
  const publicStories = useMemo(
    () => stories.filter((s) => s.visibility === "public"),
    [stories]
  );

  // Facets
  const moods = useMemo(
    () => [...new Set(publicStories.map((s) => s.mood).filter(Boolean))],
    [publicStories]
  );
  const locations = useMemo(
    () => [...new Set(publicStories.map((s) => s.location).filter(Boolean))],
    [publicStories]
  );
  const tags = useMemo(
    () => [
      ...new Set(publicStories.flatMap((s) => s.tags || []).filter(Boolean)),
    ],
    [publicStories]
  );

  // Filtering
  const filteredStories = useMemo(() => {
    let list = publicStories;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter((s) => {
        const tagText = (s.tags || []).join(" ");
        return `${s.title} ${s.body} ${s.mood || ""} ${
          s.location || ""
        } ${tagText}`
          .toLowerCase()
          .includes(q);
      });
    }
    if (filterMood) {
      list = list.filter((s) => s.mood === filterMood);
    }
    if (filterLocation) {
      list = list.filter((s) => s.location === filterLocation);
    }
    if (filterTag) {
      list = list.filter((s) => (s.tags || []).includes(filterTag));
    }
    return list;
  }, [publicStories, query, filterMood, filterLocation, filterTag]);

  function clearFilters() {
    setQuery("");
    setFilterMood("");
    setFilterLocation("");
    setFilterTag("");
  }

  return (
    <section className="card">
      <h2>Discover</h2>
      <p className="meta">
        Public stories only. Low social pressure: bookmark/save first.
      </p>

      {/* Search */}
      <SearchBar
        query={query}
        onChange={setQuery}
        placeholder="Search by title, mood, location, or tag…"
      />

      {/* Filters */}
      <div className="row">
        <select
          className="select"
          value={filterMood}
          onChange={(e) => setFilterMood(e.target.value)}
          aria-label="Filter by mood"
        >
          <option value="">All moods</option>
          {moods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
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
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        {/* NEW: Tag filter */}
        <select
          className="select"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button className="btn" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {/* Results */}
      <p className="meta" style={{ marginTop: ".5rem" }}>
        {filteredStories.length} result{filteredStories.length === 1 ? "" : "s"}
      </p>

      <ul className="reset" style={{ marginTop: "0.5rem" }}>
        {filteredStories.length === 0 && <p>No matching public stories.</p>}

        {filteredStories.map((s) => (
          <li key={s.id} className="card" style={{ marginBottom: ".75rem" }}>
            <div className="meta">
              {new Date(s.createdAt).toLocaleDateString()} • {s.mood || "—"} •{" "}
              {s.location || "—"}
            </div>
            <h3 style={{ marginTop: ".3rem" }}>{s.title || "(untitled)"}</h3>
            {s.images?.length > 0 && (
              <img
                src={s.images[0]}
                alt="story thumbnail"
                style={{
                  width: "100%",
                  maxHeight: 180,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginTop: ".5rem",
                }}
              />
            )}

            <p>
              {s.body.slice(0, 160)}
              {s.body.length > 160 ? "…" : ""}
            </p>
            {s.tags?.length > 0 && (
              <p className="meta">Tags: {s.tags.join(", ")}</p>
            )}
            <div className="row">
              <button className="btn" onClick={() => toggleBookmark(s.id)}>
                {bookmarks.includes(s.id) ? "★ Bookmarked" : "☆ Bookmark"}
              </button>
              <button
                className="btn"
                onClick={() => navigate(`/story/${s.id}`)}
              >
                Open
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
