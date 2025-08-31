import { useState } from "react";
import { useStories } from "../store/stories.js";
import { downloadJSON } from "../utils/download.js";

export default function SettingsPage() {
  const { prefs, setPrefs, exportAll, clearAll } = useStories();

  const [local, setLocal] = useState({
    defaultVisibility: prefs.defaultVisibility,
    defaultAllowComments: prefs.defaultAllowComments,
    defaultAllowLikes: prefs.defaultAllowLikes,
    defaultShareLocation: prefs.defaultShareLocation,
    displayName: prefs.displayName || "",
    theme: prefs.theme || "system",
  });

  function update(field, value) {
    setLocal((prev) => ({ ...prev, [field]: value }));
  }

  function save() {
    setPrefs(local);
    alert("Settings updated.");
  }

  function handleExport() {
    const payload = exportAll();
    downloadJSON("travel-stories-export.json", payload);
  }

  function handleClear() {
    const ok = confirm(
      "Clear all local stories and keep current settings? This cannot be undone."
    );
    if (ok) clearAll();
  }

  return (
    <section className="card settings" aria-labelledby="settings-title">
      <h2 id="settings-title">Settings</h2>
      <p className="meta">
        Personalise your profile, theme, and defaults. You can override per story.
      </p>

      {/* Profile */}
      <h3>Profile</h3>
      <div className="row settings-row">
        <div className="field-col">
          <label className="label" htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            className="input"
            placeholder="e.g., Ada"
            value={local.displayName}
            onChange={(e) => update("displayName", e.target.value)}
          />
          <p className="meta">Shown on public stories when you don’t post anonymously.</p>
        </div>

        <div className="field-col compact">
          <label className="label" htmlFor="theme">Theme</label>
          <select
            id="theme"
            className="select"
            value={local.theme}
            onChange={(e) => update("theme", e.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      {/* Defaults */}
      <h3>Defaults for new stories</h3>
      <div className="row settings-row">
        <div className="field-col compact">
          <label className="label" htmlFor="defaultVisibility">Default visibility</label>
          <select
            id="defaultVisibility"
            className="select"
            value={local.defaultVisibility}
            onChange={(e) => update("defaultVisibility", e.target.value)}
          >
            <option value="private">Private (only me)</option>
            <option value="friends">Friends</option>
            <option value="public">Public</option>
          </select>
        </div>

        <label className="label checkbox">
          <input
            type="checkbox"
            checked={local.defaultAllowComments}
            onChange={(e) => update("defaultAllowComments", e.target.checked)}
          />
          Allow comments by default
        </label>

        <label className="label checkbox">
          <input
            type="checkbox"
            checked={local.defaultAllowLikes}
            onChange={(e) => update("defaultAllowLikes", e.target.checked)}
          />
          Allow likes by default
        </label>

        <label className="label checkbox">
          <input
            type="checkbox"
            checked={local.defaultShareLocation}
            onChange={(e) => update("defaultShareLocation", e.target.checked)}
          />
          Share location by default (coarse)
        </label>
      </div>

      <div className="row" style={{ marginTop: ".75rem", gap: ".5rem" }}>
        <button className="btn primary" onClick={save}>Save settings</button>
      </div>

      <hr className="settings-divider" />

      <h3>Data management</h3>
      <div className="row settings-row">
        <button className="btn" onClick={handleExport}>Export my data (JSON)</button>
        <button className="btn" onClick={handleClear}>Clear all local stories</button>
      </div>

      <p className="meta">All data is stored locally on your device. No tracking.</p>
    </section>
  );
}
