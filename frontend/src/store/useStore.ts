/**
 * =============================================================================
 * USESTORE.TS - GLOBAL STATE MANAGEMENT (Zustand Store)
 * =============================================================================
 *
 * This is the "brain" of the frontend application. It stores all the important
 * data and provides functions to modify that data.
 *
 * WHAT IS "STATE"?
 * State is data that changes over time and affects what the user sees.
 * Examples: Is the user logged in? What storyboards do they have? Which scene
 * are they editing?
 *
 * WHY USE A STORE?
 * Without a store, you'd have to pass data through many levels of components.
 * With a store, any component can access or update the data directly.
 *
 * HOW TO USE:
 * In any component, import and use like this:
 *   const { user, storyboards, createScene } = useStore();
 *
 * ZUSTAND:
 * We use a library called "Zustand" (German for "state") which makes state
 * management simple. It's like a global variable that React knows to watch.
 */

import { create } from 'zustand';
import { api } from '../api/client';
import type { User, Storyboard, Scene, Template, StoryboardStats, Comment } from '../types';


/**
 * AppState Interface - Defines everything stored in our global state
 *
 * This is split into two parts:
 * 1. DATA - The actual values stored (user, storyboards, etc.)
 * 2. ACTIONS - Functions that modify the data (login, createScene, etc.)
 */
interface AppState {
  // ==================== DATA ====================

  // AUTHENTICATION STATE
  user: User | null;           // Current logged-in user (null if not logged in)
  isAuthenticated: boolean;    // Quick check: are we logged in?
  isLoading: boolean;          // True while checking auth status on app load

  // STORYBOARD STATE
  storyboards: Storyboard[];   // List of all user's storyboards (for Dashboard)
  currentStoryboard: Storyboard | null; // The storyboard being edited right now
  storyboardStats: StoryboardStats | null; // Statistics for current storyboard

  // TEMPLATES
  templates: Template[];       // Available storyboard templates

  // UI STATE
  darkMode: boolean;           // Is dark mode enabled?
  selectedScenes: string[];    // IDs of scenes selected for bulk actions
  editingScene: Scene | null;  // Scene currently open in the editor modal

  // ==================== ACTIONS (Functions) ====================

  // AUTH ACTIONS
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;

  // STORYBOARD ACTIONS
  fetchStoryboards: () => Promise<void>;
  fetchStoryboard: (id: string) => Promise<void>;
  createStoryboard: (data: { title: string; description?: string; targetDuration?: number; templateId?: string }) => Promise<Storyboard>;
  updateStoryboard: (id: string, data: Partial<Storyboard>) => Promise<void>;
  deleteStoryboard: (id: string) => Promise<void>;
  duplicateStoryboard: (id: string) => Promise<Storyboard>;
  fetchStoryboardStats: (id: string) => Promise<void>;

  // SCENE ACTIONS
  createScene: (storyboardId: string, data: Partial<Scene>) => Promise<Scene>;
  updateScene: (id: string, data: Partial<Scene>) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  duplicateScene: (id: string) => Promise<Scene>;
  reorderScenes: (sceneIds: string[]) => Promise<void>;
  bulkDeleteScenes: (sceneIds: string[]) => Promise<void>;

  // VISUAL REFERENCE ACTIONS
  addVisualReference: (sceneId: string, url: string, caption?: string) => Promise<void>;
  deleteVisualReference: (sceneId: string, refId: string) => Promise<void>;

  // COMMENT ACTIONS
  createComment: (content: string, sceneId?: string) => Promise<Comment>;
  deleteComment: (id: string) => Promise<void>;

  // TEMPLATE ACTIONS
  fetchTemplates: () => Promise<void>;

  // UI ACTIONS
  toggleDarkMode: () => void;
  setSelectedScenes: (ids: string[]) => void;
  toggleSceneSelection: (id: string) => void;
  clearSceneSelection: () => void;
  setEditingScene: (scene: Scene | null) => void;
}


/**
 * CREATE THE STORE
 *
 * create<AppState>() creates a store with the shape defined above.
 * Inside, we define all initial values and action implementations.
 *
 * The (set, get) parameters are provided by Zustand:
 * - set: Function to update the state
 * - get: Function to read the current state
 */
export const useStore = create<AppState>((set, get) => ({

  // =========================================================================
  // INITIAL STATE VALUES
  // =========================================================================
  // These are the starting values when the app first loads

  user: null,                    // No user logged in initially
  isAuthenticated: false,        // Not authenticated
  isLoading: true,               // Loading until we check for saved session
  storyboards: [],               // Empty storyboard list
  currentStoryboard: null,       // No storyboard being edited
  storyboardStats: null,         // No stats yet
  templates: [],                 // Empty template list
  darkMode: localStorage.getItem('darkMode') === 'true', // Load saved preference
  selectedScenes: [],            // No scenes selected
  editingScene: null,            // No scene being edited


  // =========================================================================
  // AUTHENTICATION ACTIONS
  // =========================================================================

  /**
   * LOGIN - Authenticate with email and password
   *
   * 1. Send credentials to the server
   * 2. Server validates and returns user info + auth token
   * 3. Update store with user info and mark as authenticated
   */
  login: async (email, password) => {
    const { user } = await api.login(email, password);
    set({ user, isAuthenticated: true });
  },

  /**
   * REGISTER - Create a new account
   *
   * Same flow as login, but creates a new user first.
   */
  register: async (email, password, name) => {
    const { user } = await api.register(email, password, name);
    set({ user, isAuthenticated: true });
  },

  /**
   * LOGOUT - End the current session
   *
   * 1. Clear the auth token from localStorage
   * 2. Reset all user-related state to initial values
   */
  logout: () => {
    api.logout(); // Clears token from localStorage
    set({
      user: null,
      isAuthenticated: false,
      storyboards: [],
      currentStoryboard: null,
      templates: [],
    });
  },

  /**
   * CHECK AUTH - Verify if user has a saved login session
   *
   * Called when the app first loads. Checks localStorage for a saved token,
   * then validates it with the server.
   *
   * If valid → User is logged in automatically
   * If invalid → Token is cleared and user must log in again
   */
  checkAuth: async () => {
    try {
      // Is there a saved token?
      if (api.getToken()) {
        // Validate token by fetching current user info
        const user = await api.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        // No token saved - just stop loading
        set({ isLoading: false });
      }
    } catch {
      // Token is invalid or expired - clear it
      api.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },


  // =========================================================================
  // STORYBOARD ACTIONS
  // =========================================================================

  /**
   * FETCH STORYBOARDS - Get all storyboards for the logged-in user
   *
   * Called when the Dashboard loads to populate the storyboard list.
   */
  fetchStoryboards: async () => {
    const storyboards = await api.getStoryboards();
    set({ storyboards });
  },

  /**
   * FETCH STORYBOARD - Load a single storyboard with all its scenes
   *
   * Called when opening the StoryboardEditor page.
   */
  fetchStoryboard: async (id) => {
    const storyboard = await api.getStoryboard(id);
    set({ currentStoryboard: storyboard });
  },

  /**
   * CREATE STORYBOARD - Create a new storyboard
   *
   * After creating, adds it to the beginning of the storyboards list
   * so it appears first on the Dashboard.
   */
  createStoryboard: async (data) => {
    const storyboard = await api.createStoryboard(data);
    // Add to beginning of list (most recent first)
    set((state) => ({ storyboards: [storyboard, ...state.storyboards] }));
    return storyboard;
  },

  /**
   * UPDATE STORYBOARD - Modify storyboard settings (title, description, etc.)
   *
   * Updates both the Dashboard list and the current storyboard if it matches.
   */
  updateStoryboard: async (id, data) => {
    const updated = await api.updateStoryboard(id, data);
    set((state) => ({
      // Update in the list
      storyboards: state.storyboards.map((s) => (s.id === id ? updated : s)),
      // Update current if it's the one being edited
      currentStoryboard: state.currentStoryboard?.id === id ? updated : state.currentStoryboard,
    }));
  },

  /**
   * DELETE STORYBOARD - Permanently remove a storyboard
   *
   * Removes from the list and clears currentStoryboard if it was deleted.
   */
  deleteStoryboard: async (id) => {
    await api.deleteStoryboard(id);
    set((state) => ({
      storyboards: state.storyboards.filter((s) => s.id !== id),
      currentStoryboard: state.currentStoryboard?.id === id ? null : state.currentStoryboard,
    }));
  },

  /**
   * DUPLICATE STORYBOARD - Create a copy of an existing storyboard
   *
   * The server creates the copy and returns it. We add it to the list.
   */
  duplicateStoryboard: async (id) => {
    const storyboard = await api.duplicateStoryboard(id);
    set((state) => ({ storyboards: [storyboard, ...state.storyboards] }));
    return storyboard;
  },

  /**
   * FETCH STORYBOARD STATS - Get statistics for the current storyboard
   *
   * Calculates total duration, scene breakdown, completion percentage, etc.
   */
  fetchStoryboardStats: async (id) => {
    const stats = await api.getStoryboardStats(id);
    set({ storyboardStats: stats });
  },


  // =========================================================================
  // SCENE ACTIONS
  // =========================================================================

  /**
   * CREATE SCENE - Add a new scene to the current storyboard
   *
   * Adds the scene to the end of the scenes array.
   */
  createScene: async (storyboardId, data) => {
    const scene = await api.createScene({ storyboardId, ...data });
    set((state) => {
      // Only update if we're looking at the right storyboard
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

  /**
   * UPDATE SCENE - Modify a scene's properties
   *
   * Finds the scene in the array and replaces it with the updated version.
   */
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

  /**
   * DELETE SCENE - Remove a scene from the storyboard
   *
   * After deletion, renumbers remaining scenes (1, 2, 3...) to close gaps.
   * Also removes the scene from any selection.
   */
  deleteScene: async (id) => {
    await api.deleteScene(id);
    set((state) => {
      if (state.currentStoryboard) {
        const scenes = state.currentStoryboard.scenes
          .filter((s) => s.id !== id) // Remove the deleted scene
          .map((s, i) => ({ ...s, order: i + 1 })); // Renumber remaining
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

  /**
   * DUPLICATE SCENE - Create a copy of a scene
   *
   * The copy is inserted right after the original in the sequence.
   */
  duplicateScene: async (id) => {
    const scene = await api.duplicateScene(id);
    set((state) => {
      if (state.currentStoryboard) {
        // Find where the original is
        const index = state.currentStoryboard.scenes.findIndex((s) => s.id === id);
        const scenes = [...state.currentStoryboard.scenes];
        // Insert copy right after original
        scenes.splice(index + 1, 0, scene);
        // Renumber all scenes
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

  /**
   * REORDER SCENES - Change the order of scenes (drag and drop)
   *
   * Takes an array of scene IDs in the new order, then rearranges
   * the scenes array to match.
   */
  reorderScenes: async (sceneIds) => {
    const { currentStoryboard } = get();
    if (!currentStoryboard) return;

    await api.reorderScenes(currentStoryboard.id, sceneIds);

    set((state) => {
      if (state.currentStoryboard) {
        // Create a map for quick lookup: id -> scene
        const sceneMap = new Map(state.currentStoryboard.scenes.map((s) => [s.id, s]));
        // Rebuild array in new order with updated order numbers
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

  /**
   * BULK DELETE SCENES - Delete multiple selected scenes at once
   *
   * More efficient than deleting one by one.
   */
  bulkDeleteScenes: async (sceneIds) => {
    const { currentStoryboard } = get();
    if (!currentStoryboard) return;

    await api.bulkDeleteScenes(currentStoryboard.id, sceneIds);

    set((state) => {
      if (state.currentStoryboard) {
        const scenes = state.currentStoryboard.scenes
          .filter((s) => !sceneIds.includes(s.id)) // Remove all deleted
          .map((s, i) => ({ ...s, order: i + 1 })); // Renumber
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            scenes,
          },
          selectedScenes: [], // Clear selection
        };
      }
      return state;
    });
  },


  // =========================================================================
  // VISUAL REFERENCE ACTIONS
  // =========================================================================

  /**
   * ADD VISUAL REFERENCE - Attach an image to a scene
   *
   * Visual references are inspiration images, sketches, or examples
   * that help communicate the vision for a scene.
   */
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

  /**
   * DELETE VISUAL REFERENCE - Remove an image from a scene
   */
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


  // =========================================================================
  // COMMENT ACTIONS
  // =========================================================================

  /**
   * CREATE COMMENT - Add a comment to the storyboard or a specific scene
   *
   * Comments appear in reverse chronological order (newest first).
   */
  createComment: async (content, sceneId) => {
    const { currentStoryboard } = get();
    if (!currentStoryboard) throw new Error('No storyboard selected');

    const comment = await api.createComment(currentStoryboard.id, content, sceneId);
    set((state) => {
      if (state.currentStoryboard) {
        return {
          currentStoryboard: {
            ...state.currentStoryboard,
            comments: [comment, ...state.currentStoryboard.comments], // Add to start
          },
        };
      }
      return state;
    });
    return comment;
  },

  /**
   * DELETE COMMENT - Remove a comment
   */
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


  // =========================================================================
  // TEMPLATE ACTIONS
  // =========================================================================

  /**
   * FETCH TEMPLATES - Load all available storyboard templates
   */
  fetchTemplates: async () => {
    const templates = await api.getTemplates();
    set({ templates });
  },


  // =========================================================================
  // UI ACTIONS
  // =========================================================================

  /**
   * TOGGLE DARK MODE - Switch between light and dark themes
   *
   * Also saves the preference to localStorage so it persists.
   */
  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.darkMode;
      // Save preference
      localStorage.setItem('darkMode', String(newDarkMode));
      // Toggle the CSS class on the root element
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: newDarkMode };
    });
  },

  /**
   * SCENE SELECTION - For bulk operations (delete multiple scenes, etc.)
   */
  setSelectedScenes: (ids) => {
    set({ selectedScenes: ids });
  },

  toggleSceneSelection: (id) => {
    set((state) => ({
      selectedScenes: state.selectedScenes.includes(id)
        ? state.selectedScenes.filter((sid) => sid !== id) // Remove if selected
        : [...state.selectedScenes, id], // Add if not selected
    }));
  },

  clearSceneSelection: () => {
    set({ selectedScenes: [] });
  },

  /**
   * EDITING SCENE - Track which scene is open in the editor modal
   */
  setEditingScene: (scene) => {
    set({ editingScene: scene });
  },
}));


// =========================================================================
// INITIALIZE DARK MODE ON PAGE LOAD
// =========================================================================
// This runs once when the file is imported. It checks localStorage and
// applies the saved dark mode preference before React even renders.
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark');
}
