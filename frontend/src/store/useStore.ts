import { create } from 'zustand';
import { api } from '../api/client';
import type { User, Storyboard, Scene, Template, StoryboardStats, Comment } from '../types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Storyboards
  storyboards: Storyboard[];
  currentStoryboard: Storyboard | null;
  storyboardStats: StoryboardStats | null;

  // Templates
  templates: Template[];

  // UI
  darkMode: boolean;
  selectedScenes: string[];
  editingScene: Scene | null;

  // Actions - Auth
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;

  // Actions - Storyboards
  fetchStoryboards: () => Promise<void>;
  fetchStoryboard: (id: string) => Promise<void>;
  createStoryboard: (data: { title: string; description?: string; targetDuration?: number; templateId?: string }) => Promise<Storyboard>;
  updateStoryboard: (id: string, data: Partial<Storyboard>) => Promise<void>;
  deleteStoryboard: (id: string) => Promise<void>;
  duplicateStoryboard: (id: string) => Promise<Storyboard>;
  fetchStoryboardStats: (id: string) => Promise<void>;

  // Actions - Scenes
  createScene: (storyboardId: string, data: Partial<Scene>) => Promise<Scene>;
  updateScene: (id: string, data: Partial<Scene>) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  duplicateScene: (id: string) => Promise<Scene>;
  reorderScenes: (sceneIds: string[]) => Promise<void>;
  bulkDeleteScenes: (sceneIds: string[]) => Promise<void>;

  // Actions - Visual References
  addVisualReference: (sceneId: string, url: string, caption?: string) => Promise<void>;
  deleteVisualReference: (sceneId: string, refId: string) => Promise<void>;

  // Actions - Comments
  createComment: (content: string, sceneId?: string) => Promise<Comment>;
  deleteComment: (id: string) => Promise<void>;

  // Actions - Templates
  fetchTemplates: () => Promise<void>;

  // Actions - UI
  toggleDarkMode: () => void;
  setSelectedScenes: (ids: string[]) => void;
  toggleSceneSelection: (id: string) => void;
  clearSceneSelection: () => void;
  setEditingScene: (scene: Scene | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  storyboards: [],
  currentStoryboard: null,
  storyboardStats: null,
  templates: [],
  darkMode: localStorage.getItem('darkMode') === 'true',
  selectedScenes: [],
  editingScene: null,

  // Auth actions
  login: async (email, password) => {
    const { user } = await api.login(email, password);
    set({ user, isAuthenticated: true });
  },

  register: async (email, password, name) => {
    const { user } = await api.register(email, password, name);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    api.logout();
    set({
      user: null,
      isAuthenticated: false,
      storyboards: [],
      currentStoryboard: null,
      templates: [],
    });
  },

  checkAuth: async () => {
    try {
      if (api.getToken()) {
        const user = await api.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      api.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Storyboard actions
  fetchStoryboards: async () => {
    const storyboards = await api.getStoryboards();
    set({ storyboards });
  },

  fetchStoryboard: async (id) => {
    const storyboard = await api.getStoryboard(id);
    set({ currentStoryboard: storyboard });
  },

  createStoryboard: async (data) => {
    const storyboard = await api.createStoryboard(data);
    set((state) => ({ storyboards: [storyboard, ...state.storyboards] }));
    return storyboard;
  },

  updateStoryboard: async (id, data) => {
    const updated = await api.updateStoryboard(id, data);
    set((state) => ({
      storyboards: state.storyboards.map((s) => (s.id === id ? updated : s)),
      currentStoryboard: state.currentStoryboard?.id === id ? updated : state.currentStoryboard,
    }));
  },

  deleteStoryboard: async (id) => {
    await api.deleteStoryboard(id);
    set((state) => ({
      storyboards: state.storyboards.filter((s) => s.id !== id),
      currentStoryboard: state.currentStoryboard?.id === id ? null : state.currentStoryboard,
    }));
  },

  duplicateStoryboard: async (id) => {
    const storyboard = await api.duplicateStoryboard(id);
    set((state) => ({ storyboards: [storyboard, ...state.storyboards] }));
    return storyboard;
  },

  fetchStoryboardStats: async (id) => {
    const stats = await api.getStoryboardStats(id);
    set({ storyboardStats: stats });
  },

  // Scene actions
  createScene: async (storyboardId, data) => {
    const scene = await api.createScene({ storyboardId, ...data });
    set((state) => {
      if (state.currentStoryboard?.id === storyboardId) {
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes: [...state.currentStoryboard.scenes, scene],
          },
        };
      }
      return state;
    });
    return scene;
  },

  updateScene: async (id, data) => {
    const updated = await api.updateScene(id, data);
    set((state) => {
      if (state.currentStoryboard) {
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes: state.currentStoryboard.scenes.map((s) => (s.id === id ? updated : s)),
          },
        };
      }
      return state;
    });
  },

  deleteScene: async (id) => {
    await api.deleteScene(id);
    set((state) => {
      if (state.currentStoryboard) {
        const scenes = state.currentStoryboard.scenes
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, order: i + 1 }));
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes,
          },
          selectedScenes: state.selectedScenes.filter((sid) => sid !== id),
        };
      }
      return state;
    });
  },

  duplicateScene: async (id) => {
    const scene = await api.duplicateScene(id);
    set((state) => {
      if (state.currentStoryboard) {
        const index = state.currentStoryboard.scenes.findIndex((s) => s.id === id);
        const scenes = [...state.currentStoryboard.scenes];
        scenes.splice(index + 1, 0, scene);
        // Update order numbers
        const reorderedScenes = scenes.map((s, i) => ({ ...s, order: i + 1 }));
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes: reorderedScenes,
          },
        };
      }
      return state;
    });
    return scene;
  },

  reorderScenes: async (sceneIds) => {
    const { currentStoryboard } = get();
    if (!currentStoryboard) return;

    await api.reorderScenes(currentStoryboard.id, sceneIds);

    set((state) => {
      if (state.currentStoryboard) {
        const sceneMap = new Map(state.currentStoryboard.scenes.map((s) => [s.id, s]));
        const reorderedScenes = sceneIds.map((id, index) => ({
          ...sceneMap.get(id)!,
          order: index + 1,
        }));
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes: reorderedScenes,
          },
        };
      }
      return state;
    });
  },

  bulkDeleteScenes: async (sceneIds) => {
    const { currentStoryboard } = get();
    if (!currentStoryboard) return;

    await api.bulkDeleteScenes(currentStoryboard.id, sceneIds);

    set((state) => {
      if (state.currentStoryboard) {
        const scenes = state.currentStoryboard.scenes
          .filter((s) => !sceneIds.includes(s.id))
          .map((s, i) => ({ ...s, order: i + 1 }));
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes,
          },
          selectedScenes: [],
        };
      }
      return state;
    });
  },

  // Visual reference actions
  addVisualReference: async (sceneId, url, caption) => {
    const ref = await api.addVisualReference(sceneId, url, caption);
    set((state) => {
      if (state.currentStoryboard) {
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes: state.currentStoryboard.scenes.map((s) =>
              s.id === sceneId
                ? { ...s, visualReferences: [...s.visualReferences, ref] }
                : s
            ),
          },
        };
      }
      return state;
    });
  },

  deleteVisualReference: async (sceneId, refId) => {
    await api.deleteVisualReference(sceneId, refId);
    set((state) => {
      if (state.currentStoryboard) {
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes: state.currentStoryboard.scenes.map((s) =>
              s.id === sceneId
                ? { ...s, visualReferences: s.visualReferences.filter((r) => r.id !== refId) }
                : s
            ),
          },
        };
      }
      return state;
    });
  },

  // Comment actions
  createComment: async (content, sceneId) => {
    const { currentStoryboard } = get();
    if (!currentStoryboard) throw new Error('No storyboard selected');

    const comment = await api.createComment(currentStoryboard.id, content, sceneId);
    set((state) => {
      if (state.currentStoryboard) {
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            comments: [comment, ...state.currentStoryboard.comments],
          },
        };
      }
      return state;
    });
    return comment;
  },

  deleteComment: async (id) => {
    await api.deleteComment(id);
    set((state) => {
      if (state.currentStoryboard) {
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            comments: state.currentStoryboard.comments.filter((c) => c.id !== id),
          },
        };
      }
      return state;
    });
  },

  // Template actions
  fetchTemplates: async () => {
    const templates = await api.getTemplates();
    set({ templates });
  },

  // UI actions
  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(newDarkMode));
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: newDarkMode };
    });
  },

  setSelectedScenes: (ids) => {
    set({ selectedScenes: ids });
  },

  toggleSceneSelection: (id) => {
    set((state) => ({
      selectedScenes: state.selectedScenes.includes(id)
        ? state.selectedScenes.filter((sid) => sid !== id)
        : [...state.selectedScenes, id],
    }));
  },

  clearSceneSelection: () => {
    set({ selectedScenes: [] });
  },

  setEditingScene: (scene) => {
    set({ editingScene: scene });
  },
}));

// Initialize dark mode from localStorage
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark');
}
