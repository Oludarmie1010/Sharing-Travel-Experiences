import { Link, useNavigate } from 'react-router-dom';
import { useStories } from '../store/stories.js';
import { useState } from 'react';
import '../styles/home.css'
import Hero from '../components/Hero.jsx';

export default function HomePage() {
  const { stories, toggleLike, addComment } = useStories();
  const navigate = useNavigate();

  const featured = stories
    .filter(s => s.visibility === 'public')
    .slice(0, 6);

  return (
    <section className="card home home-page">
      <h2>Welcome Travellers</h2>
      <br></br>
      <br></br>
      <br></br>
      <div className="row">
        <Link to="/create" className="btn primary">Create a Story</Link>
        <Link to="/timeline" className="btn">Your Timeline</Link>
        <Link to="/discover" className="btn">Discover</Link>
        <Link to="/about-data" className="btn">Data use & transparency</Link>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Recent Stories</h3>
      <ul className="reset" style={{ marginTop: '.5rem' }}>
        {featured.map(story => (
          <StoryCard
            key={story.id}
            story={story}
            onLike={() => toggleLike(story.id)}
            onComment={(text) => addComment(story.id, text)}
            onOpen={() => navigate(`/story/${story.id}`)}
          />
        ))}
      </ul>
    </section>
  );
}

function StoryCard({ story, onLike, onComment, onOpen }) {
  const [commentText, setCommentText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const t = commentText.trim();
    if (!t) return;
    onComment(t);
    setCommentText('');
  };

  return (
    <li
      className="card clickable"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{ marginBottom: '.75rem', cursor: 'pointer' }}
      aria-label={`Open story: ${story.title || 'untitled'}`}
    >
      {/* Image (renders if present) */}
      {story.images?.length > 0 && (
        <img
          src={story.images[0]}
          alt={story.title || 'Story image'}
          style={{
            width: '100%',
            borderRadius: '0.5rem',
            marginBottom: '.5rem',
            objectFit: 'cover',
            maxHeight: 220
          }}
        />
      )}

      <div className="meta">
        {new Date(story.createdAt).toLocaleDateString()} • {story.mood || '—'} • {story.location || '—'}
      </div>
      <h4 style={{ marginTop: '.4rem' }}>{story.title || '(untitled)'}</h4>
      <p>{story.body.slice(0, 120)}{story.body.length > 120 ? '…' : ''}</p>

      {/* Social actions */}
      <div
        className="row"
        style={{ marginTop: '.5rem', gap: '.5rem', justifyContent: 'space-between' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn" onClick={onLike}>❤️ {story.likes || 0}</button>

        <button
          className="btn"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: story.title || 'Travel story',
                text: story.body.slice(0, 100),
                url: `${window.location.origin}/story/${story.id}`,
              }).catch(() => {});
            } else {
              // Fallback: copy URL
              navigator.clipboard?.writeText(`${window.location.origin}/story/${story.id}`);
              alert('Link copied to clipboard.');
            }
          }}
        >
          🔗 Share
        </button>

        <button
          className="btn"
          onClick={() => {
            // focus the input for quick comment
            const el = document.getElementById(`cmt-${story.id}`);
            el?.focus();
          }}
        >
          💬 {story.comments?.length || 0}
        </button>
      </div>

      {/* Inline quick comment */}
      <form
        onSubmit={submit}
        className="row"
        style={{ marginTop: '.5rem', gap: '.5rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          id={`cmt-${story.id}`}
          className="input"
          placeholder="Write a comment…"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button type="submit" className="btn">Post</button>
      </form>
    </li>
  );
}
