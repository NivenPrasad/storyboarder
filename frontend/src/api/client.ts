/**
 * =============================================================================
 * CLIENT.TS - API CLIENT (Frontend ↔ Backend Communication)
 * =============================================================================
 *
 * This file handles ALL communication between the frontend and backend.
 * Think of it as a "messenger" that sends requests to the server and
 * brings back the responses.
 *
 * HOW WEB APIS WORK:
 * 1. Frontend calls a method like api.createScene(...)
 * 2. This sends an HTTP request to the server (like /api/scenes)
 * 3. Server processes the request and sends back data
 * 4. This client receives the data and returns it
 *
 * HTTP METHODS:
 * - GET: Fetch data (like reading a book)
 * - POST: Create new data (like writing a new page)
 * - PATCH: Update existing data (like editing a page)
 * - DELETE: Remove data (like tearing out a page)
 *
 * AUTHENTICATION:
 * When you log in, the server gives you a "token" (like a VIP pass).
 * This token is sent with every request to prove who you are.
 */

// Base URL for all API requests (relative URL uses same domain)
const API_BASE = '/api';


/**
 * API CLIENT CLASS
 *
 * A class is like a blueprint for creating objects. This class creates
 * a single "api" object that has all the methods for talking to the server.
 */
class ApiClient {
  // The authentication token (JWT) - like a VIP pass
  private token: string | null = null;

  /**
   * CONSTRUCTOR - Runs when the class is first created
   *
   * Checks localStorage for a saved token from a previous session.
   * This is how "remember me" works - you don't have to log in again.
   */
  constructor() {
    this.token = localStorage.getItem('token');
  }

  /**
   * SET TOKEN - Save or clear the authentication token
   *
   * Called after login (to save) or logout (to clear).
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token); // Save for future sessions
    } else {
      localStorage.removeItem('token'); // Clear on logout
    }
  }

  /**
   * GET TOKEN - Check if we have a saved token
   */
  getToken() {
    return this.token;
  }

  /**
   * REQUEST - The core method that actually sends HTTP requests
   *
   * This is a "private" method (only used internally by this class).
   * All the public methods below use this to send requests.
   *
   * @param endpoint - The API path (e.g., "/storyboards" or "/scenes/123")
   * @param options - HTTP options (method, body, headers, etc.)
   * @returns The server's response data (parsed from JSON)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Set up headers (metadata sent with the request)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json', // Tell server we're sending JSON
      ...(options.headers as Record<string, string>),
    };

    // If logged in, include the auth token
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      // "Bearer" is a standard prefix for JWT tokens
    }

    // Send the actual HTTP request using fetch()
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if the request was successful (status 200-299)
    if (!response.ok) {
      // Something went wrong - parse and throw the error
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
        code: 'UNKNOWN_ERROR',
      }));
      throw error;
    }

    // Status 204 means "success, but no content to return"
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse and return the JSON response
    return response.json();
  }


  // =========================================================================
  // AUTHENTICATION ENDPOINTS
  // =========================================================================

  /**
   * LOGIN - Authenticate with email and password
   *
   * Returns user info and a token for future requests.
   */
  async login(email: string, password: string) {
    const response = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token); // Save the token
    return response;
  }

  /**
   * REGISTER - Create a new user account
   */
  async register(email: string, password: string, name: string) {
    const response = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(response.token);
    return response;
  }

  /**
   * GET ME - Fetch the current user's profile
   *
   * Used to verify that the saved token is still valid.
   */
  async getMe() {
    return this.request<any>('/auth/me');
  }

  /**
   * UPDATE ME - Update the current user's profile
   */
  async updateMe(data: { name?: string; avatarUrl?: string }) {
    return this.request<any>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * LOGOUT - Clear the saved token
   */
  logout() {
    this.setToken(null);
  }


  // =========================================================================
  // STORYBOARD ENDPOINTS
  // =========================================================================

  /**
   * GET STORYBOARDS - Fetch all storyboards for the logged-in user
   */
  async getStoryboards() {
    return this.request<any[]>('/storyboards');
  }

  /**
   * GET STORYBOARD - Fetch a single storyboard with all its scenes
   */
  async getStoryboard(id: string) {
    return this.request<any>(`/storyboards/${id}`);
  }

  /**
   * GET SHARED STORYBOARD - Fetch a publicly shared storyboard
   *
   * Uses the unique share link instead of the ID.
   * Doesn't require authentication.
   */
  async getSharedStoryboard(shareLink: string) {
    return this.request<any>(`/storyboards/shared/${shareLink}`);
  }

  /**
   * CREATE STORYBOARD - Create a new storyboard
   */
  async createStoryboard(data: { title: string; description?: string; targetDuration?: number; templateId?: string }) {
    return this.request<any>('/storyboards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * UPDATE STORYBOARD - Modify storyboard settings
   */
  async updateStoryboard(id: string, data: { title?: string; description?: string; targetDuration?: number; isPublic?: boolean }) {
    return this.request<any>(`/storyboards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE STORYBOARD - Permanently delete a storyboard
   */
  async deleteStoryboard(id: string) {
    return this.request<void>(`/storyboards/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * DUPLICATE STORYBOARD - Create a copy of a storyboard
   */
  async duplicateStoryboard(id: string) {
    return this.request<any>(`/storyboards/${id}/duplicate`, {
      method: 'POST',
    });
  }

  /**
   * SHARE STORYBOARD - Grant access to another user
   *
   * @param permission - 'view' (read-only) or 'edit' (full access)
   */
  async shareStoryboard(id: string, email: string, permission: 'view' | 'edit') {
    return this.request<any>(`/storyboards/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    });
  }

  /**
   * REMOVE COLLABORATOR - Revoke someone's access
   */
  async removeCollaborator(storyboardId: string, userId: string) {
    return this.request<void>(`/storyboards/${storyboardId}/share/${userId}`, {
      method: 'DELETE',
    });
  }

  /**
   * GET STORYBOARD STATS - Get statistics about a storyboard
   */
  async getStoryboardStats(id: string) {
    return this.request<any>(`/storyboards/${id}/stats`);
  }


  // =========================================================================
  // SCENE ENDPOINTS
  // =========================================================================

  /**
   * CREATE SCENE - Add a new scene to a storyboard
   */
  async createScene(data: any) {
    return this.request<any>('/scenes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * GET SCENE - Fetch a single scene by ID
   */
  async getScene(id: string) {
    return this.request<any>(`/scenes/${id}`);
  }

  /**
   * UPDATE SCENE - Modify a scene's properties
   */
  async updateScene(id: string, data: any) {
    return this.request<any>(`/scenes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE SCENE - Remove a scene
   */
  async deleteScene(id: string) {
    return this.request<void>(`/scenes/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * DUPLICATE SCENE - Create a copy of a scene
   */
  async duplicateScene(id: string) {
    return this.request<any>(`/scenes/${id}/duplicate`, {
      method: 'POST',
    });
  }

  /**
   * REORDER SCENES - Change the order of scenes
   *
   * @param sceneIds - Array of scene IDs in the new order
   */
  async reorderScenes(storyboardId: string, sceneIds: string[]) {
    return this.request<void>('/scenes/reorder', {
      method: 'POST',
      body: JSON.stringify({ storyboardId, sceneIds }),
    });
  }

  /**
   * BULK DELETE SCENES - Delete multiple scenes at once
   */
  async bulkDeleteScenes(storyboardId: string, sceneIds: string[]) {
    return this.request<void>('/scenes/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ storyboardId, sceneIds }),
    });
  }

  /**
   * ADD VISUAL REFERENCE - Attach an image to a scene
   */
  async addVisualReference(sceneId: string, url: string, caption?: string) {
    return this.request<any>(`/scenes/${sceneId}/visual-references`, {
      method: 'POST',
      body: JSON.stringify({ url, caption }),
    });
  }

  /**
   * DELETE VISUAL REFERENCE - Remove an image from a scene
   */
  async deleteVisualReference(sceneId: string, refId: string) {
    return this.request<void>(`/scenes/${sceneId}/visual-references/${refId}`, {
      method: 'DELETE',
    });
  }


  // =========================================================================
  // TEMPLATE ENDPOINTS
  // =========================================================================

  /**
   * GET TEMPLATES - Fetch all available templates
   */
  async getTemplates() {
    return this.request<any[]>('/templates');
  }

  /**
   * GET TEMPLATE - Fetch a single template
   */
  async getTemplate(id: string) {
    return this.request<any>(`/templates/${id}`);
  }

  /**
   * CREATE TEMPLATE FROM STORYBOARD - Save a storyboard as a reusable template
   */
  async createTemplateFromStoryboard(storyboardId: string, name: string, description?: string) {
    return this.request<any>(`/templates/from-storyboard/${storyboardId}`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  /**
   * CREATE TEMPLATE - Create a new template from scratch
   */
  async createTemplate(data: { name: string; description?: string; scenes: any[] }) {
    return this.request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * UPDATE TEMPLATE - Modify a template
   */
  async updateTemplate(id: string, data: { name?: string; description?: string; scenes?: any[] }) {
    return this.request<any>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE TEMPLATE - Remove a template
   */
  async deleteTemplate(id: string) {
    return this.request<void>(`/templates/${id}`, {
      method: 'DELETE',
    });
  }


  // =========================================================================
  // COMMENT ENDPOINTS
  // =========================================================================

  /**
   * GET STORYBOARD COMMENTS - Fetch all comments on a storyboard
   */
  async getStoryboardComments(storyboardId: string) {
    return this.request<any[]>(`/comments/storyboard/${storyboardId}`);
  }

  /**
   * GET SCENE COMMENTS - Fetch comments for a specific scene
   */
  async getSceneComments(sceneId: string) {
    return this.request<any[]>(`/comments/scene/${sceneId}`);
  }

  /**
   * CREATE COMMENT - Add a new comment
   */
  async createComment(storyboardId: string, content: string, sceneId?: string) {
    return this.request<any>('/comments', {
      method: 'POST',
      body: JSON.stringify({ storyboardId, sceneId, content }),
    });
  }

  /**
   * UPDATE COMMENT - Edit a comment
   */
  async updateComment(id: string, content: string) {
    return this.request<any>(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  /**
   * DELETE COMMENT - Remove a comment
   */
  async deleteComment(id: string) {
    return this.request<void>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }


  // =========================================================================
  // UPLOAD ENDPOINTS
  // =========================================================================

  /**
   * UPLOAD IMAGE - Upload an image file to the server
   *
   * This is special because it sends a file, not JSON.
   * Uses FormData instead of JSON.stringify().
   *
   * @returns The URL where the image can be accessed
   */
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    // FormData is a special object for sending files
    const formData = new FormData();
    formData.append('image', file); // 'image' is the field name the server expects

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // Note: We DON'T set Content-Type here - the browser sets it automatically
    // for FormData, including the proper boundary for multipart data

    const response = await fetch(`${API_BASE}/uploads/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Upload failed',
        code: 'UPLOAD_ERROR',
      }));
      throw error;
    }

    return response.json();
  }

  /**
   * DELETE UPLOAD - Remove an uploaded file
   */
  async deleteUpload(filename: string) {
    return this.request<void>(`/uploads/${filename}`, {
      method: 'DELETE',
    });
  }


  // =========================================================================
  // EXPORT ENDPOINTS
  // =========================================================================

  /**
   * GET EXPORT URL - Get the URL to download a storyboard export
   *
   * This returns a URL that the browser can navigate to for download.
   * The actual download is triggered by opening this URL.
   *
   * @param format - Export format (csv, json, pdf, etc.)
   */
  getExportUrl(storyboardId: string, format: 'csv' | 'json' | 'pdf' | 'notion' | 'gdocs' | 'print') {
    return `${API_BASE}/export/${storyboardId}/${format}`;
  }
}


// =========================================================================
// EXPORT SINGLETON INSTANCE
// =========================================================================
// Create one instance of ApiClient that the whole app shares.
// This is called a "singleton" pattern.
export const api = new ApiClient();
