import { FileGridItem, UploadProgress } from '@/types';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFile(
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void
  ): Promise<FileGridItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  async downloadFile(id: string, onProgress?: (progress: number) => void): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/files/${id}/download`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  async getShareByToken(id: string): Promise<any> {
    return this.request(`/shares/${id}`);
  }

  async getPermissions(id: string, type: string): Promise<any> {
    return this.request(`/permissions/${type}/${id}`);
  }

  async shareFile(id: string, days: number): Promise<any> {
    return this.request('/shares', {
      method: 'POST',
      body: JSON.stringify({ id, days }),
    });
  }

  async updateFile(id: string, data: any): Promise<any> {
    return this.request(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateFolder(id: string, data: any): Promise<any> {
    return this.request(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getStorageUsage(): Promise<any> {
    return this.request('/storage/usage');
  }

  async getFolders(parentId?: string): Promise<any> {
    return this.request(`/folders${parentId ? `/${parentId}` : ''}`);
  }

  async getFolderById(id: string): Promise<any> {
    return this.request(`/folders/${id}`);
  }

  async getFiles(folderId?: string): Promise<any> {
    return this.request(`/files${folderId ? `?folderId=${folderId}` : ''}`);
  }

  async createFolder(data: any): Promise<any> {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteFile(id: string): Promise<void> {
    await this.request(`/files/${id}`, { method: 'DELETE' });
  }

  async deleteFolder(id: string, permanent?: boolean): Promise<void> {
    await this.request(`/folders/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
    });
  }

  async getFilePreview(id: string): Promise<any> {
    return this.request(`/files/${id}/preview`);
  }

  async getTrashItems(): Promise<any> {
    return this.request('/trash');
  }

  async restoreFile(id: string): Promise<void> {
    await this.request(`/files/${id}/restore`, { method: 'POST' });
  }

  async permanentlyDeleteFile(id: string): Promise<void> {
    await this.request(`/files/${id}?permanent=true`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();