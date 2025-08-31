// src/components/SuggestionsPanel.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  suggestTitle, suggestTags, suggestMood,
  suggestOutline, suggestHighlights, suggestLocation
} from '../ai/suggest.js';

export default function SuggestionsPanel({ text, onApply }) {
  const [open, setOpen] = useState(true);

  const data = useMemo(() => {
    const t = text || '';
    return {
      title: suggestTitle(t),
      tags: suggestTags(t),
      mood: suggestMood(t),
      outline: suggestOutline(t),
      highlights: suggestHighlights(t),
      location: suggestLocation(t)
    };
  }, [text]);

  // Debounce re-render feel (optional)
  const [debounced, setDebounced] = useState(data);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(data), 150);
    return () => clearTimeout(id);
  }, [data]);

  if (!(text && text.trim())) {
    return (
      <div className="card" style={{ marginTop: '.75rem' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>Smart Suggestions</strong>
          <button className="btn" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Show'}</button>
        </div>
        {open && <p className="meta">Start typing your story to get suggestions.</p>}
      </div>
    );
  }

  const s = debounced;

  return (
    <div className="card" style={{ marginTop: '.75rem' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>Smart Suggestions</strong>
        <button className="btn" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Show'}</button>
      </div>

      {open && (
        <>
          {/* Title */}
          {s.title && (
            <div className="row" style={{ marginTop: '.5rem' }}>
              <div style={{ flex: 1 }}>
                <span className="meta">Suggested title</span>
                <div>{s.title}</div>
              </div>
              <button className="btn" onClick={() => onApply({ title: s.title })}>Use title</button>
            </div>
          )}

          {/* Mood & Location */}
          <div className="row" style={{ marginTop: '.5rem' }}>
            {s.mood && (
              <>
                <div style={{ flex: 1 }}>
                  <span className="meta">Mood</span>
                  <div>{s.mood}</div>
                </div>
                <button className="btn" onClick={() => onApply({ mood: s.mood })}>Use mood</button>
              </>
            )}
            {s.location && (
              <>
                <div style={{ flex: 1 }}>
                  <span className="meta">Location</span>
                  <div>{s.location}</div>
                </div>
                <button className="btn" onClick={() => onApply({ location: s.location })}>Use location</button>
              </>
            )}
          </div>

          {/* Tags */}
          {s.tags?.length > 0 && (
            <div style={{ marginTop: '.5rem' }}>
              <span className="meta">Suggested tags</span>
              <div className="row" style={{ flexWrap: 'wrap', gap: '.5rem' }}>
                {s.tags.map(tag => (
                  <button key={tag} className="btn" onClick={() => onApply({ tagsAdd: [tag] })}>+ {tag}</button>
                ))}
                <button className="btn" onClick={() => onApply({ tagsReplace: s.tags })}>Use all</button>
              </div>
            </div>
          )}

          {/* Outline */}
          {s.outline?.length > 0 && (
            <div style={{ marginTop: '.5rem' }}>
              <span className="meta">Outline</span>
              <ul>
                {s.outline.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              <button
                className="btn"
                onClick={() => onApply({ appendBody: '\n' + s.outline.map(x => `• ${x}`).join('\n') + '\n' })}
              >
                Insert outline
              </button>
            </div>
          )}

          {/* Highlights */}
          {s.highlights?.length > 0 && (
            <div style={{ marginTop: '.5rem' }}>
              <span className="meta">Highlights</span>
              <ul>
                {s.highlights.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              <button
                className="btn"
                onClick={() => onApply({ appendBody: '\nHighlights:\n' + s.highlights.map(x => `– ${x}`).join('\n') + '\n' })}
              >
                Insert highlights
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
