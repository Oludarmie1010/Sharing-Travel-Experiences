import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStories } from "../store/stories.js";
import { downloadJSON, downloadText } from "../utils/download.js";
import { copyText, buildStoryURL } from "../utils/clipboard.js";

function slug(s) {
  return (
    (s || "(untitled)")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "story"
  );
}

function dismissedKey(id) {
  return `ts_public_banner_dismissed_${id}`;
}

export default function StoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    stories,
    bookmarks,
    toggleBookmark,
    removeStory,
    toggleLike,
    addComment,
    updateStory, 
    prefs,
  } = useStories();

  const [commentText, setCommentText] = useState("");
  const [hidePublicBanner, setHidePublicBanner] = useState(false);

  const story = stories.find((s) => s.id === id);
  if (!story) {
    return (
      <section className="card">
        <h2>Story not found</h2>
        <p className="meta">It may have been deleted or never existed.</p>
        <button className="btn" onClick={() => navigate(-1)}>
          Go back
        </button>
      </section>
    );
  }

  const isBookmarked = bookmarks.includes(story.id);
  const isPublic = story.visibility === "public";

  // Load dismissed state for the banner (per-story)
  useEffect(() => {
    if (!story) return;
    const dismissed = localStorage.getItem(dismissedKey(story.id)) === "1";
    setHidePublicBanner(dismissed);
  }, [story]);

  function dismissBanner() {
    setHidePublicBanner(true);
    localStorage.setItem(dismissedKey(story.id), "1");
  }

  function makePrivate() {
    updateStory(story.id, { visibility: "private" });
    setHidePublicBanner(true);
    localStorage.setItem(dismissedKey(story.id), "1");
    alert("This story is now Private.");
  }

  function exportTXT() {
    const lines = [];
    lines.push(story.title || "(untitled)");
    const metaBits = [
      new Date(story.createdAt).toLocaleString(),
      story.visibility,
      story.mood || "—",
      story.location || "—",
    ];
    if (isPublic && !story.isAnonymous && prefs.displayName) {
      metaBits.push(`By ${prefs.displayName}`);
    }
    lines.push(metaBits.join(" • "));
    lines.push("");
    lines.push(story.body || "");
    if (Array.isArray(story.comments) && story.comments.length) {
      lines.push("");
      lines.push("--- Comments ---");
      story.comments.forEach((c) => {
        lines.push(`[${new Date(c.date).toLocaleString()}] ${c.text}`);
      });
    }
    downloadText(`${slug(story.title)}.txt`, lines.join("\n"));
  }

  function exportJSON() {
    const payload = {
      id: story.id,
      title: story.title,
      body: story.body,
      mood: story.mood || null,
      location: story.location || null,
      visibility: story.visibility,
      isAnonymous: !!story.isAnonymous,
      displayName:
        isPublic && !story.isAnonymous && prefs.displayName
          ? prefs.displayName
          : null,
      likes: story.likes || 0,
      comments: story.comments || [],
      createdAt: story.createdAt,
      updatedAt: story.updatedAt || story.createdAt,
      exportedAt: new Date().toISOString(),
      source: "Travel Stories Prototype (local)",
    };
    downloadJSON(`${slug(story.title)}.json`, payload);
  }

  async function shareLink() {
    if (!isPublic) return;
    const url = buildStoryURL(story.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title || "Travel Story",
          text: "Check out this story:",
          url,
        });
        return;
      } catch {

      }
    }
    const ok = await copyText(url);
    alert(ok ? "Link copied to clipboard." : "Could not copy link.");
  }

  return (
    <section className="card story-page">
      {isPublic && !hidePublicBanner && (
        <div
          className="card story-banner"
          role="status"
          aria-live="polite"
        >
          <div className="meta">
            This story is <strong>Public</strong>. Anyone with the link can view
            it.
          </div>
          <div className="row story-actions">
            <button className="btn" onClick={makePrivate}>
              Make Private
            </button>
            <button className="btn" onClick={dismissBanner}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="meta">
        {new Date(story.createdAt).toLocaleString()} • {story.visibility} •{" "}
        {story.mood || "—"} • {story.location || "—"}
      </div>

      {/* Title */}
      <h2>{story.title || "(untitled)"}</h2>
      {isPublic && !story.isAnonymous && prefs.displayName && (
        <p className="meta">By {prefs.displayName}</p>
      )}

      {/* Body */}
      <p style={{ whiteSpace: "pre-line" }}>{story.body}</p>

      {/* Actions */}
      <div className="row" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
        {isPublic && (
          <button className="btn" onClick={() => toggleBookmark(story.id)}>
            {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </button>
        )}
        <button className="btn" onClick={() => toggleLike(story.id)}>
          ❤️ {story.likes || 0}
        </button>
        {isPublic && (
          <button className="btn" onClick={shareLink}>
            Share
          </button>
        )}
        <button className="btn" onClick={exportTXT}>
          Export (TXT)
        </button>
        <button className="btn" onClick={exportJSON}>
          Export (JSON)
        </button>
        <button
          className="btn"
          onClick={() => {
            removeStory(story.id);
            navigate("/timeline");
          }}
        >
          Delete
        </button>
        <button className="btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {/* Comments */}
      <div style={{ marginTop: "2rem" }}>
        {story.images?.length > 0 && (
          <div className="story-gallery">
            {story.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`story image ${i + 1}`}
                style={{ maxWidth: "200px", borderRadius: 8 }}
              />
            ))}
          </div>
        )}

        <h3>Comments ({story.comments?.length || 0})</h3>
        <ul>
          {story.comments?.map((c, idx) => (
            <li key={idx}>
              <p>{c.text}</p>
              <small>{new Date(c.date).toLocaleString()}</small>
            </li>
          ))}
        </ul>

        {isPublic && (
          <div className="row" style={{ marginTop: "1rem" }}>
            <input
              className="input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              className="btn"
              onClick={() => {
                if (commentText.trim()) {
                  addComment(story.id, commentText.trim());
                  setCommentText("");
                }
              }}
            >
              Post
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
