export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
 
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { document.body.removeChild(ta); return false; }
  document.body.removeChild(ta);
  return true;
}


export function buildStoryURL(id) {
  const { origin, pathname, hash } = window.location;
 
  if (hash && hash.startsWith('#/')) {
    const base = `${origin}${pathname.replace(/\/$/, '')}`;
    return `${base}#/story/${id}`;
  }
  return `${origin}/story/${id}`;
}
