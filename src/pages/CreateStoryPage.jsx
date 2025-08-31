import { useEffect, useMemo, useState } from "react";
import { useStories } from "../store/stories.js";
import PromptTray from "../components/PromptTray.jsx";
import SuggestionsPanel from "../components/SuggestionPanel.jsx";
import ImageUploader from "../components/ImageUploader.jsx";
import { useSpeechToText } from "../hooks/useSpeechToText.jsx";
import "../styles/createStories.css";

const TEMPLATES = [
  { id: "none", label: "None" },
  { id: "highlight", label: "Highlight — What stood out?" },
  { id: "lesson", label: "Lesson — What did you learn?" },
  { id: "memory", label: "Memory — A moment to remember" },
  { id: "tip", label: "Practical Tip — What would you tell a friend?" },
];

const VISIBILITY = [
  { id: "private", label: "Private (only me)" },
  { id: "friends", label: "Friends" },
  { id: "public", label: "Public" },
];

function scaffoldFor(template) {
  switch (template) {
    case "highlight":
      return `What happened:
Why it mattered:
Where/when:
If you go:`;
    case "lesson":
      return `Context:
What I learned:
What I’d do differently next time:
Advice for others:`;
    case "memory":
      return `Setting (place/time):
People involved:
The moment:
How it felt:
Why I’ll remember this:`;
    case "tip":
      return `Problem:
My tip:
How to apply it:
Bonus (budget/time saver):`;
    default:
      return "";
  }
}

const BASE_PROMPTS = [
  "Most memorable moment",
  "A small detail I won’t forget",
  "Something that surprised me",
  "A challenge I overcame",
  "If I could redo one thing…",
  "What I’d tell a friend going here",
];

const DRAFT_KEY = "ts_draft";

export default function CreateStoryPage() {
  const { addStory, prefs } = useStories();
  const [form, setForm] = useState({
    title: "",
    body: "",
    template: "none",
    mood: "",
    location: "",
    visibility: prefs.defaultVisibility,
    allowComments: prefs.defaultAllowComments,
    allowLikes: prefs.defaultAllowLikes,
    isAnonymous: true,
    images: [],
    tags: [],
  });

  const [saveState, setSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const bodyLen = form.body.trim().length;
  const { listening, error, speechError, result, start, stop } =
    useSpeechToText();

  useEffect(() => {
    if (result) {
      const sep = form.body && !form.body.endsWith("\n") ? "\n" : "";
      update("body", `${form.body}${sep}${result}`);
    }
  }, [result]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setForm((f) => ({ ...f, ...parsed }));
      setLastSavedAt(parsed.__savedAt || null);
    } catch {}
  }, []);

  useEffect(() => {
    setSaveState("saving");
    const t = setTimeout(() => {
      try {
        const payload = { ...form, __savedAt: new Date().toISOString() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        setLastSavedAt(payload.__savedAt);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form]);

  const canPublish = useMemo(
    () => form.title.trim() && form.body.trim(),
    [form]
  );

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function applyTemplate(id) {
    update("template", id);
    const scaffold = scaffoldFor(id);
    if (
      !form.body.trim() ||
      confirm("Replace current body with template scaffold?")
    ) {
      update("body", scaffold);
    }
  }

  const prompts = useMemo(() => {
    const arr = [...BASE_PROMPTS];
    if (!form.mood) arr.push("Describe your mood in one word");
    if (!form.location) arr.push("Where were you? (City, Country)");
    if (form.template === "lesson") arr.push("What triggered the lesson?");
    if (form.template === "tip") arr.push("Who benefits most from this tip?");
    return arr.slice(0, 8);
  }, [form.mood, form.location, form.template]);

  function insertPrompt(p) {
    const sep = form.body && !form.body.endsWith("\n") ? "\n" : "";
    update("body", `${form.body}${sep}${p}: `);
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setForm((f) => ({ ...f, title: "", body: "" }));
    setSaveState("idle");
    setLastSavedAt(null);
  }

  function handlePublish() {
    if (!canPublish) return;
    if (form.visibility === "public") {
      const ok = confirm(
        "Make this story public? Anyone with the link can view it."
      );
      if (!ok) return;
    }
    addStory(form);
    localStorage.removeItem(DRAFT_KEY);
    setForm((s) => ({ ...s, title: "", body: "" }));
    setSaveState("idle");
    setLastSavedAt(null);
    alert("Story saved to your timeline.");
  }

  return (
    <section className="card">
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "baseline" }}
      >
        <h2>Create a Story</h2>
        <span className="meta" aria-live="polite">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" &&
            (lastSavedAt
              ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
              : "Saved")}
          {saveState === "error" && "Save error (local storage)"}
        </span>
      </div>

      {/* Template picker */}
      <div className="row">
        <div>
          <label className="label">Template</label>
          <select
            className="select"
            value={form.template}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label className="label">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g., Sunrise at Olumo Rock"
          />
        </div>
      </div>

      {/* Body */}
      <div className="row">
        <div style={{ flex: 1 }}>
          <label className="label">Your story</label>
          <textarea
            className="textarea"
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
            placeholder="Use the template prompts above or your own words…"
          />
          <p className="meta">
            {bodyLen} character{bodyLen === 1 ? "" : "s"}
          </p>

          <PromptTray prompts={prompts} onPick={insertPrompt} />

          <div
            className="row"
            style={{ marginTop: ".5rem", alignItems: "center", gap: ".5rem" }}
          >
            <button
              type="button"
              className="btn"
              onClick={listening ? stop : start}
              disabled={!!speechError}
            >
              {listening ? "Stop Recording" : "🎤 Voice Note"}
            </button>
            {listening && <span className="meta">Listening… speak now</span>}
            {speechError && (
              <span className="meta" style={{ color: "red" }}>
                {speechError}
              </span>
            )}
          </div>
          <ImageUploader
            images={form.images || []}
            onChange={(imgs) => update("images", imgs)}
          />
          <SuggestionsPanel
            text={form.body}
            onApply={(patch) => {
              // title / mood / location direct sets
              if (patch.title) update("title", patch.title);
              if (patch.mood) update("mood", patch.mood);
              if (patch.location) update("location", patch.location);

              // tags add/replace
              if (patch.tagsReplace) {
                const uniq = [
                  ...new Set(patch.tagsReplace.map((t) => t.toLowerCase())),
                ];
                update("tags", uniq);
              }
              if (patch.tagsAdd) {
                const next = new Set([
                  ...(form.tags || []).map((t) => t.toLowerCase()),
                  ...patch.tagsAdd.map((t) => t.toLowerCase()),
                ]);
                update("tags", [...next]);
              }

              // append body
              if (patch.appendBody) {
                const sep = form.body && !form.body.endsWith("\n") ? "\n" : "";
                update("body", `${form.body}${sep}${patch.appendBody}`);
              }
            }}
          />
        </div>
      </div>

      {/* Mood / Location */}
      <div className="row">
        <div style={{ flex: 1 }}>
          <label className="label">Mood (optional)</label>
          <input
            className="input"
            value={form.mood}
            onChange={(e) => update("mood", e.target.value)}
            placeholder="Joyful, Reflective, Challenging…"
            aria-label="Mood"
          />
        </div>

        {/* Tags */}
        <div className="cs-field">
          <label className="label">Tags</label>
          <input
            className="input"
            placeholder="Add tags separated by commas…"
            value={form.tags.join(", ")}
            onChange={(e) => {
              const next = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              update("tags", next);
            }}
            aria-label="Tags (comma-separated)"
          />

          {form.tags.length > 0 && (
            <div className="cs-tags" role="list">
              {form.tags.map((t) => (
                <span key={t} className="tag" role="listitem">
                  {t}
                  <button
                    type="button"
                    className="tag-remove"
                    aria-label={`Remove tag ${t}`}
                    onClick={() => {
                      const next = form.tags.filter((x) => x !== t);
                      update("tags", next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const next = form.tags.filter((x) => x !== t);
                        update("tags", next);
                      }
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <label className="label">Location (optional, coarse)</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="City, Country"
            aria-label="Location"
          />
        </div>
      </div>

      {/* Visibility & toggles */}
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div>
          <label className="label">Visibility</label>
          <select
            className="select"
            value={form.visibility}
            onChange={(e) => update("visibility", e.target.value)}
          >
            {VISIBILITY.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          {/* NEW: public visibility nudge */}
          {form.visibility === "public" && (
            <div
              className="card"
              style={{ marginTop: ".5rem", borderStyle: "dashed" }}
            >
              <div className="meta">
                This story will be <strong>Public</strong>. Anyone with the link
                can view it.
              </div>
            </div>
          )}
        </div>
        <label
          className="label"
          style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
        >
          <input
            type="checkbox"
            checked={form.isAnonymous}
            onChange={(e) => update("isAnonymous", e.target.checked)}
          />
          Post anonymously
        </label>
        <label
          className="label"
          style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
        >
          <input
            type="checkbox"
            checked={form.allowComments}
            onChange={(e) => update("allowComments", e.target.checked)}
          />
          Allow comments
        </label>
        <label
          className="label"
          style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
        >
          <input
            type="checkbox"
            checked={form.allowLikes}
            onChange={(e) => update("allowLikes", e.target.checked)}
          />
          Allow likes
        </label>
      </div>

      {/* Actions */}
      <div className="row">
        <button className="btn" onClick={clearDraft}>
          Clear draft
        </button>
        <button
          className="btn primary"
          disabled={!canPublish}
          onClick={handlePublish}
        >
          {form.visibility === "public"
            ? "Publish (Public)"
            : "Publish to Timeline"}
        </button>
      </div>

      <p className="meta">
        No photos/videos required. All data stays on your device for this
        prototype.
      </p>
    </section>
  );
}
