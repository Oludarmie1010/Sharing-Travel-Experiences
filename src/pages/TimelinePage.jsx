import { useMemo, useState } from "react";
import { useStories } from "../store/stories.js";
import { useNavigate } from "react-router-dom";
import '../styles/timeline.css'

const DRAFT_KEY = "ts_draft";

function readDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if ((d.title && d.title.trim()) || (d.body && d.body.trim())) return d;
  } catch {}
  return null;
}

export default function TimelinePage() {
  const { stories, removeStory } = useStories();
  const [q, setQ] = useState("");
  const [vis, setVis] = useState("any");
  const [filterTag, setFilterTag] = useState("");
  const navigate = useNavigate();

  const draft = readDraft();

  // Tag facet across *your* stories
  const tags = useMemo(
    () => [...new Set(stories.flatMap((s) => s.tags || []).filter(Boolean))],
    [stories]
  );

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      const text = `${s.title} ${s.body} ${s.mood || ""} ${s.location || ""} ${(
        s.tags || []
      ).join(" ")}`.toLowerCase();
      const hit = text.includes(q.toLowerCase());
      const okVis = vis === "any" ? true : s.visibility === vis;
      const okTag = filterTag ? (s.tags || []).includes(filterTag) : true;
      return hit && okVis && okTag;
    });
  }, [stories, q, vis, filterTag]);

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setQ((q) => q + "");
  }

  return (
    <section className="timeline-page">
      <h2>Your Timeline</h2>

      {/* Resume Draft banner */}
      {draft && (
        <div
          className="card"
          style={{ marginBottom: "1rem", borderStyle: "dashed" }}
        >
          <div className="meta">
            Unsaved draft •{" "}
            {draft.__savedAt
              ? `Last saved ${new Date(draft.__savedAt).toLocaleTimeString()}`
              : "Autosave on"}
          </div>
          <h3 style={{ marginTop: ".3rem" }}>
            {draft.title || "(untitled draft)"}
          </h3>
          <p>
            {(draft.body || "").slice(0, 160)}
            {(draft.body || "").length > 160 ? "…" : ""}
          </p>
          <div className="row">
            <button className="btn primary" onClick={() => navigate("/create")}>
              Resume draft
            </button>
            <button className="btn" onClick={discardDraft}>
              Discard draft
            </button>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="row">
        <input
          className="input"
          placeholder="Search title, text, mood, location, or tag"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select"
          value={vis}
          onChange={(e) => setVis(e.target.value)}
        >
          <option value="any">Any visibility</option>
          <option value="private">Private</option>
          <option value="friends">Friends</option>
          <option value="public">Public</option>
        </select>
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
      </div>

      <p className="meta" style={{ marginTop: ".5rem" }}>
        {filtered.length} item{filtered.length === 1 ? "" : "s"}
      </p>

      <ul className="reset" style={{ marginTop: "1rem" }}>
        {filtered.map((s) => (
          <li key={s.id} className="card" style={{ marginBottom: ".75rem" }}>
            <div className="meta">
              {new Date(s.createdAt).toLocaleString()} • {s.visibility} •{" "}
              {s.mood || "—"} • {s.location || "—"}
            </div>
            <h3 style={{ marginTop: ".3rem" }}>{s.title || "(untitled)"}</h3>
            {s.images?.length > 0 && (
              <img
                src={s.images[0]}
                alt="timeline thumbnail"
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
              {s.body.slice(0, 240)}
              {s.body.length > 240 ? "…" : ""}
            </p>
            {s.tags?.length > 0 && (
              <p className="meta">Tags: {s.tags.join(", ")}</p>
            )}
            <div className="row">
              <button
                className="btn"
                onClick={() => navigate(`/story/${s.id}`)}
              >
                Open
              </button>
              <button className="btn" onClick={() => removeStory(s.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <p className="meta">No stories match your search.</p>
        )}
      </ul>
    </section>
  );
}
