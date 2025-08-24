import { useAuthStore } from '@/store/authStore';

export async function getSignedUrl(fileId: string): Promise<string> {
  const authStore = useAuthStore.getState();
  const token = authStore.token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`/api/files/${fileId}/signed-url`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get signed URL');
  }

  const data = await response.json();
  return data.url;
}

export async function downloadFile(fileId: string, onProgress?: (progress: number) => void): Promise<Blob> {
  const authStore = useAuthStore.getState();
  let token = authStore.token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  if (!authStore.isTokenValid()) {
    const refreshed = await authStore.refreshToken();
    if (!refreshed) {
      throw new Error('Failed to refresh token');
    }
    token = authStore.token;
  }

  const response = await fetch(`/api/files/${fileId}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  const reader = response.body?.getReader();
  const contentLength = +(response.headers.get('Content-Length') || 0);

  if (!reader) {
    throw new Error('Failed to read response');
  }

  const chunks: Uint8Array[] = [];
  let receivedLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (onProgress) {
      onProgress((receivedLength / contentLength) * 100);
    }
  }

  // Convert Uint8Array chunks to Blob
  const blob = new Blob(chunks.map(chunk => new Uint8Array(chunk)), {
    type: response.headers.get('Content-Type') || 'application/octet-stream',
  });
  return blob;
}