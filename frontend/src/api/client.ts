const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
        code: 'UNKNOWN_ERROR',
      }));
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(response.token);
    return response;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async updateMe(data: { name?: string; avatarUrl?: string }) {
    return this.request<any>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  logout() {
    this.setToken(null);
  }

  // Storyboards
  async getStoryboards() {
    return this.request<any[]>('/storyboards');
  }

  async getStoryboard(id: string) {
    return this.request<any>(`/storyboards/${id}`);
  }

  async getSharedStoryboard(shareLink: string) {
    return this.request<any>(`/storyboards/shared/${shareLink}`);
  }

  async createStoryboard(data: { title: string; description?: string; targetDuration?: number; templateId?: string }) {
    return this.request<any>('/storyboards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStoryboard(id: string, data: { title?: string; description?: string; targetDuration?: number; isPublic?: boolean }) {
    return this.request<any>(`/storyboards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteStoryboard(id: string) {
    return this.request<void>(`/storyboards/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateStoryboard(id: string) {
    return this.request<any>(`/storyboards/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async shareStoryboard(id: string, email: string, permission: 'view' | 'edit') {
    return this.request<any>(`/storyboards/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    });
  }

  async removeCollaborator(storyboardId: string, userId: string) {
    return this.request<void>(`/storyboards/${storyboardId}/share/${userId}`, {
      method: 'DELETE',
    });
  }

  async getStoryboardStats(id: string) {
    return this.request<any>(`/storyboards/${id}/stats`);
  }

  // Scenes
  async createScene(data: any) {
    return this.request<any>('/scenes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScene(id: string) {
    return this.request<any>(`/scenes/${id}`);
  }

  async updateScene(id: string, data: any) {
    return this.request<any>(`/scenes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteScene(id: string) {
    return this.request<void>(`/scenes/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateScene(id: string) {
    return this.request<any>(`/scenes/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async reorderScenes(storyboardId: string, sceneIds: string[]) {
    return this.request<void>('/scenes/reorder', {
      method: 'POST',
      body: JSON.stringify({ storyboardId, sceneIds }),
    });
  }

  async bulkDeleteScenes(storyboardId: string, sceneIds: string[]) {
    return this.request<void>('/scenes/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ storyboardId, sceneIds }),
    });
  }

  async addVisualReference(sceneId: string, url: string, caption?: string) {
    return this.request<any>(`/scenes/${sceneId}/visual-references`, {
      method: 'POST',
      body: JSON.stringify({ url, caption }),
    });
  }

  async deleteVisualReference(sceneId: string, refId: string) {
    return this.request<void>(`/scenes/${sceneId}/visual-references/${refId}`, {
      method: 'DELETE',
    });
  }

  // Templates
  async getTemplates() {
    return this.request<any[]>('/templates');
  }

  async getTemplate(id: string) {
    return this.request<any>(`/templates/${id}`);
  }

  async createTemplateFromStoryboard(storyboardId: string, name: string, description?: string) {
    return this.request<any>(`/templates/from-storyboard/${storyboardId}`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async createTemplate(data: { name: string; description?: string; scenes: any[] }) {
    return this.request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: { name?: string; description?: string; scenes?: any[] }) {
    return this.request<any>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: string) {
    return this.request<void>(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getStoryboardComments(storyboardId: string) {
    return this.request<any[]>(`/comments/storyboard/${storyboardId}`);
  }

  async getSceneComments(sceneId: string) {
    return this.request<any[]>(`/comments/scene/${sceneId}`);
  }

  async createComment(storyboardId: string, content: string, sceneId?: string) {
    return this.request<any>('/comments', {
      method: 'POST',
      body: JSON.stringify({ storyboardId, sceneId, content }),
    });
  }

  async updateComment(id: string, content: string) {
    return this.request<any>(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(id: string) {
    return this.request<void>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // Uploads
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

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

  async deleteUpload(filename: string) {
    return this.request<void>(`/uploads/${filename}`, {
      method: 'DELETE',
    });
  }

  // Export URLs
  getExportUrl(storyboardId: string, format: 'csv' | 'json' | 'pdf' | 'notion' | 'gdocs' | 'print') {
    return `${API_BASE}/export/${storyboardId}/${format}`;
  }
}

export const api = new ApiClient();
