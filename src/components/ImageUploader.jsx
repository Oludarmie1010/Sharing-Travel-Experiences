// src/components/ImageUploader.jsx
import { useRef } from 'react';

export default function ImageUploader({ images, onChange }) {
  const inputRef = useRef();

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        onChange([...(images || []), reader.result]);
      };
      reader.readAsDataURL(file);
    });
    inputRef.current.value = ''; // reset
  }

  function removeImage(idx) {
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
  }

  return (
    <div className="card" style={{ marginTop: '.75rem' }}>
      <label className="btn">
        Add Photo(s)
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={inputRef}
          onChange={handleFiles}
        />
      </label>

      {images?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.5rem' }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={src}
                alt={`upload-${i}`}
                style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8 }}
              />
              <button
                className="btn"
                style={{ position: 'absolute', top: 0, right: 0 }}
                onClick={() => removeImage(i)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
