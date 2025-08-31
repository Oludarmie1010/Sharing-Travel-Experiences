import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStories } from "../store/stories.js";
import PromptTray from "../components/PromptTray.jsx";
import SuggestionsPanel from "../components/SuggestionPanel.jsx";
import ImageUploader from "../components/ImageUploader.jsx";
import { useSpeechToText } from "../hooks/useSpeechToText.jsx";

const VISIBILITY = [
  { id: "private", label: "Private (only me)" },
  { id: "friends", label: "Friends" },
  { id: "public", label: "Public" },
];

const BASE_PROMPTS = [
  "Most memorable moment",
  "A small detail I won’t forget",
  "Something that surprised me",
  "A challenge I overcame",
  "If I could redo one thing…",
  "What I’d tell a friend going here",
];

function editKey(id) {
  return `ts_edit_${id}`;
}

export default function EditStoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { stories, updateStory, prefs } = useStories();

  const original = stories.find((s) => s.id === id);
  if (!original) {
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

  const [form, setForm] = useState({
    title: original.title || "",
    body: original.body || "",
    template: original.template || "none",
    mood: original.mood || "",
    location: original.location || "",
    visibility: original.visibility || prefs.defaultVisibility,
    allowComments: original.allowComments ?? prefs.defaultAllowComments,
    allowLikes: original.allowLikes ?? prefs.defaultAllowLikes,
    isAnonymous: original.isAnonymous ?? true,
    tags: Array.isArray(original.tags) ? original.tags : [],
    images: []
  });

  const [saveState, setSaveState] = useState("idle"); // idle|saving|saved|error
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const {
    listening,
    error: speechError,
    result,
    start,
    stop,
  } = useSpeechToText({ lang: "en-US" });

  // Load edit draft if any
  useEffect(() => {
    const raw = localStorage.getItem(editKey(id));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setForm((f) => ({ ...f, ...parsed }));
      setLastSavedAt(parsed.__savedAt || null);
    } catch {}
  }, [id]);

  // Autosave with debounce
  useEffect(() => {
    setSaveState("saving");
    const t = setTimeout(() => {
      try {
        const payload = { ...form, __savedAt: new Date().toISOString() };
        localStorage.setItem(editKey(id), JSON.stringify(payload));
        setLastSavedAt(payload.__savedAt);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form, id]);

  // Append speech to body
  useEffect(() => {
    if (result) {
      const sep = form.body && !form.body.endsWith("\n") ? "\n" : "";
      setForm((prev) => ({ ...prev, body: `${prev.body}${sep}${result}` }));
    }
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = useMemo(() => form.title.trim() && form.body.trim(), [form]);
  const bodyLen = form.body.trim().length;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateTagsString(str) {
    const tags = str
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    update("tags", [...new Set(tags)]);
  }

  function clearDraft() {
    localStorage.removeItem(editKey(id));
    setSaveState("idle");
    setLastSavedAt(null);
  }

  function handleSave() {
    if (!canSave) return;
    if (form.visibility === "public" && original.visibility !== "public") {
      const ok = confirm(
        "Make this story public? Anyone with the link can view it."
      );
      if (!ok) return;
    }
    updateStory(id, form);
    localStorage.removeItem(editKey(id));
    alert("Story updated.");
    navigate(`/story/${id}`);
  }

  function cancelEdit() {
    const hasUnsaved =
      form.title !== (original.title || "") ||
      form.body !== (original.body || "") ||
      form.mood !== (original.mood || "") ||
      form.location !== (original.location || "") ||
      form.visibility !== (original.visibility || "") ||
      form.isAnonymous !== (original.isAnonymous ?? true) ||
      JSON.stringify(form.tags || []) !== JSON.stringify(original.tags || []);
    if (hasUnsaved && !confirm("Discard changes?")) return;
    navigate(`/story/${id}`);
  }

  const prompts = useMemo(() => {
    const arr = [...BASE_PROMPTS];
    if (!form.mood) arr.push("Describe your mood in one word");
    if (!form.location) arr.push("Where were you? (City, Country)");
    return arr.slice(0, 8);
  }, [form.mood, form.location]);

  return (
    <section className="card">
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "baseline" }}
      >
        <h2>Edit Story</h2>
        <span className="meta" aria-live="polite">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" &&
            (lastSavedAt
              ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
              : "Saved")}
          {saveState === "error" && "Save error (local storage)"}
        </span>
      </div>

      {/* Title */}
      <div className="row">
        <div style={{ flex: 1 }}>
          <label className="label">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Edit title…"
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
            placeholder="Edit your story…"
          />
          <p className="meta">
            {bodyLen} character{bodyLen === 1 ? "" : "s"}
          </p>

          <PromptTray
            prompts={prompts}
            onPick={(p) => {
              const sep = form.body && !form.body.endsWith("\n") ? "\n" : "";
              update("body", `${form.body}${sep}${p}: `);
            }}
          />

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
        </div>
      </div>
      <SuggestionsPanel
        text={form.body}
        onApply={(patch) => {
          if (patch.title) setForm((prev) => ({ ...prev, title: patch.title }));
          if (patch.mood) setForm((prev) => ({ ...prev, mood: patch.mood }));
          if (patch.location)
            setForm((prev) => ({ ...prev, location: patch.location }));

          if (patch.tagsReplace) {
            const uniq = [
              ...new Set(patch.tagsReplace.map((t) => t.toLowerCase())),
            ];
            setForm((prev) => ({ ...prev, tags: uniq }));
          }
          if (patch.tagsAdd) {
            const next = new Set([
              ...(form.tags || []).map((t) => t.toLowerCase()),
              ...patch.tagsAdd.map((t) => t.toLowerCase()),
            ]);
            setForm((prev) => ({ ...prev, tags: [...next] }));
          }

          if (patch.appendBody) {
            const sep = form.body && !form.body.endsWith("\n") ? "\n" : "";
            setForm((prev) => ({
              ...prev,
              body: `${prev.body}${sep}${patch.appendBody}`,
            }));
          }
        }}
      />
      <ImageUploader
  images={form.images || []}
  onChange={(imgs) => update('images', imgs)}
/>


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

      {/* Tags */}
      <div className="row">
        <div style={{ flex: 1 }}>
          <label className="label">Tags (comma-separated)</label>
          <input
            className="input"
            value={(form.tags || []).join(", ")}
            onChange={(e) => updateTagsString(e.target.value)}
            placeholder="e.g., beach, family, adventure"
            aria-label="Tags"
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
          Clear local edit draft
        </button>
        <button className="btn" onClick={cancelEdit}>
          Cancel
        </button>
        <button
          className="btn primary"
          disabled={!canSave}
          onClick={handleSave}
        >
          Save changes
        </button>
      </div>

      <p className="meta">
        Edits autosave locally. Nothing leaves your device.
      </p>
    </section>
  );
}
