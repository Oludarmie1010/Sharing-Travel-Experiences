import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { loadJSON, saveJSON } from '../utils/storage.js';

const KEY_STATE = 'ts_state_v2';
const KEY_BOOKMARKS = 'ts_bookmarks_v2';

const defaultPrefs = {
  defaultVisibility: 'private',
  defaultAllowComments: false,
  defaultAllowLikes: false,
  defaultShareLocation: false,
  displayName: '',
  theme: 'system'
};

function normalizeTags(input) {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : String(input).split(',');
  const cleaned = arr.map(t => String(t).trim().toLowerCase()).filter(Boolean);
  return [...new Set(cleaned)];
}


function normalizeImages(input) {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  const cleaned = arr
    .map(v => (v == null ? '' : String(v).trim()))
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const v of cleaned) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function normalizeStory(s) {
  return {
    id: s.id || nanoid(),
    title: (s.title || '').trim(),
    body: (s.body || '').trim(),
    template: s.template ?? null,
    mood: s.mood ?? null,
    location: s.location ?? null,
    visibility: s.visibility || 'private',
    allowComments: !!(s.allowComments ?? false),
    allowLikes: !!(s.allowLikes ?? false),
    isAnonymous: !!(s.isAnonymous ?? true),
    createdAt: s.createdAt || new Date().toISOString(),
    updatedAt: s.updatedAt || s.createdAt || new Date().toISOString(),
    tags: normalizeTags(s.tags),
    likes: Number.isFinite(s.likes) ? s.likes : 0,
    liked: !!s.liked,
    comments: Array.isArray(s.comments) ? s.comments : [],
    author: s.author || null,              
    images: normalizeImages(s.images)      
  };
}

function migrateStories(rawStories) {
  if (!Array.isArray(rawStories)) return [];
  return rawStories.map(normalizeStory);
}

let stateFromDisk = loadJSON(KEY_STATE, { stories: [], prefs: defaultPrefs });
const bookmarksFromDisk = loadJSON(KEY_BOOKMARKS, []);

let initialStories = migrateStories(stateFromDisk.stories);
let initialPrefs = { ...defaultPrefs, ...stateFromDisk.prefs };

if (initialStories.length === 0) {
  fetch('/mock_travel_stories.json')
    .then(res => res.json())
    .then(mock => {
      const stories = migrateStories(mock.stories || []);
      const prefs = { ...defaultPrefs, ...mock.prefs };
      const bookmarks = Array.isArray(mock.bookmarks) ? mock.bookmarks : [];
      saveJSON(KEY_STATE, { stories, prefs });
      saveJSON(KEY_BOOKMARKS, bookmarks);
      window.location.reload(); 
    })
    .catch(err => console.error('Failed to load mock dataset:', err));
}

saveJSON(KEY_STATE, { stories: initialStories, prefs: initialPrefs });

export const useStories = create((set, get) => ({
  stories: initialStories,
  prefs: initialPrefs,
  bookmarks: Array.isArray(bookmarksFromDisk) ? bookmarksFromDisk : [],

  // Create
  addStory: (draft) => {
    const story = normalizeStory({
      ...draft,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      visibility: draft?.visibility || get().prefs.defaultVisibility,
      allowComments: draft?.allowComments ?? get().prefs.defaultAllowComments,
      allowLikes: draft?.allowLikes ?? get().prefs.defaultAllowLikes,
      author: draft?.isAnonymous ? null : get().prefs.displayName || 'Anonymous',
      images: normalizeImages(draft?.images) 
    });

    set((state) => {
      const nextStories = [story, ...state.stories];
      saveJSON(KEY_STATE, { stories: nextStories, prefs: state.prefs });
      return { stories: nextStories };
    });
    return story.id;
  },

  // Update
  updateStory: (id, patch) => {
    set((state) => {
      const stories = state.stories.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        if ('tags' in patch) next.tags = normalizeTags(patch.tags);
        if ('images' in patch) next.images = normalizeImages(patch.images); // ✅ normalise on update
        next.updatedAt = new Date().toISOString();
        return normalizeStory(next);
      });
      saveJSON(KEY_STATE, { stories, prefs: state.prefs });
      return { stories };
    });
  },

  // Delete
  removeStory: (id) => {
    set((state) => {
      const stories = state.stories.filter((s) => s.id !== id);
      saveJSON(KEY_STATE, { stories, prefs: state.prefs });
      return { stories };
    });
  },

  // Preferences
  setPrefs: (patch) => {
    set((state) => {
      const prefs = { ...state.prefs, ...patch };
      saveJSON(KEY_STATE, { stories: state.stories, prefs });
      return { prefs };
    });
  },

  // Bookmarks
  toggleBookmark: (id) => {
    set((state) => {
      const exists = state.bookmarks.includes(id);
      const bookmarks = exists
        ? state.bookmarks.filter((b) => b !== id)
        : [id, ...state.bookmarks];
      saveJSON(KEY_BOOKMARKS, bookmarks);
      return { bookmarks };
    });
  },

  // Likes
  toggleLike: (id) => {
    set((state) => {
      const updatedStories = state.stories.map((s) =>
        s.id === id
          ? { ...s, likes: (s.likes || 0) + (s.liked ? -1 : 1), liked: !s.liked, updatedAt: new Date().toISOString() }
          : s
      );
      saveJSON(KEY_STATE, { stories: updatedStories, prefs: state.prefs });
      return { stories: updatedStories };
    });
  },

  // Comments
  addComment: (id, text) => {
    set((state) => {
      const updatedStories = state.stories.map((s) =>
        s.id === id
          ? {
              ...s,
              comments: [...(s.comments || []), { text, date: new Date().toISOString() }],
              updatedAt: new Date().toISOString()
            }
          : s
      );
      saveJSON(KEY_STATE, { stories: updatedStories, prefs: state.prefs });
      return { stories: updatedStories };
    });
  },

  // Export all
  exportAll: () => {
    const state = get();
    return {
      version: 1,
      stories: state.stories,
      prefs: state.prefs,
      bookmarks: state.bookmarks,
      exportedAt: new Date().toISOString()
    };
  },

  // Import all
  importAll: (data) => {
    if (!data || !Array.isArray(data.stories) || !data.prefs) return;
    const stories = migrateStories(data.stories);
    const prefs = { ...defaultPrefs, ...data.prefs };
    const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
    saveJSON(KEY_STATE, { stories, prefs });
    saveJSON(KEY_BOOKMARKS, bookmarks);
    set({ stories, prefs, bookmarks });
  },

  // Clear stories (keep prefs)
  clearAll: () => {
    const prefs = get().prefs;
    saveJSON(KEY_STATE, { stories: [], prefs });
    set({ stories: [] });
  },

  
  setStoryImages: (id, images) => {
    const imgs = normalizeImages(images);
    get().updateStory(id, { images: imgs });
  },

  // Add one or more images to an existing story
  appendStoryImages: (id, imagesToAdd) => {
    set((state) => {
      const imgsAdd = normalizeImages(imagesToAdd);
      const stories = state.stories.map((s) => {
        if (s.id !== id) return s;
        const merged = normalizeImages([...(s.images || []), ...imgsAdd]);
        return { ...s, images: merged, updatedAt: new Date().toISOString() };
      });
      saveJSON(KEY_STATE, { stories, prefs: state.prefs });
      return { stories };
    });
  },

  // Remove image by index
  removeStoryImage: (id, index) => {
    set((state) => {
      const stories = state.stories.map((s) => {
        if (s.id !== id) return s;
        const next = [...(s.images || [])];
        if (index >= 0 && index < next.length) next.splice(index, 1);
        return { ...s, images: next, updatedAt: new Date().toISOString() };
      });
      saveJSON(KEY_STATE, { stories, prefs: state.prefs });
      return { stories };
    });
  },

  //  helper
  getAllTags: () => {
    const { stories } = get();
    return [...new Set(stories.flatMap(s => s.tags || []).filter(Boolean))].sort();
  }
}));
