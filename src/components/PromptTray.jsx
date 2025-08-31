export default function PromptTray({ prompts = [], onPick }) {
  if (!prompts.length) return null;
  return (
    <div className="row" style={{ gap: '.5rem', marginTop: '.5rem' }}>
      {prompts.map((p, i) => (
        <button
          key={i}
          type="button"
          className="btn"
          onClick={() => onPick(p)}
          title="Insert prompt into your story"
          style={{ padding: '.35rem .6rem' }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
