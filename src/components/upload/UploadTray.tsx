import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { UploadProgress, FileGridItem } from '@/types';
import { apiClient } from '@/lib/api-client';

interface UploadTrayProps {
  currentFolderId?: string;
  onUploadComplete?: (files: FileGridItem[]) => void;
}

export default function UploadTray({ currentFolderId, onUploadComplete }: UploadTrayProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const handleFileSelect = useCallback((files: FileList) => {
    const newUploads: UploadProgress[] = Array.from(files).map((file: File) => ({
      fileId: Math.random().toString(36).substring(7),
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    }));

    setUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach((upload, index) => {
      const file = files[index];
      const uploadId = upload.fileId;

      apiClient.uploadFile(file, currentFolderId || undefined, (progress) => {
        setUploads(prev =>
          prev.map(upload =>
            upload.fileId === uploadId
              ? { ...upload, progress }
              : upload
          )
        );
      })
      .then((response) => {
        setUploads(prev =>
          prev.map(upload =>
            upload.fileId === uploadId
              ? { ...upload, status: 'completed' }
              : upload
          )
        );

        if (onUploadComplete) {
          onUploadComplete([response]);
        }
      })
      .catch(error => {
        setUploads(prev =>
          prev.map(upload =>
            upload.fileId === uploadId
              ? { ...upload, status: 'error', error: error.message }
              : upload
          )
        );
      });
    });
  }, [currentFolderId, onUploadComplete]);

  const removeUpload = (fileId: string) => {
    setUploads(prev => prev.filter(upload => upload.fileId !== fileId));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return '⏳';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-muted">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Uploads</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              disabled={!uploads.some(upload => upload.status === 'completed')}
            >
              Clear completed
            </Button>
          </div>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {uploads.map(upload => (
          <div
            key={upload.fileId}
            className="p-4 border-b border-border last:border-0"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(upload.status)}
                <span className={cn('text-sm font-medium', getStatusColor(upload.status))}>
                  {upload.fileName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUpload(upload.fileId)}
              >
                ✕
              </Button>
            </div>
            {upload.status === 'uploading' && (
              <Progress value={upload.progress} className="h-2" />
            )}
            {upload.status === 'error' && upload.error && (
              <p className="text-xs text-red-500 mt-1">{upload.error}</p>
            )}
            {upload.status === 'completed' && (
              <p className="text-xs text-green-500 mt-1">Upload complete</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}