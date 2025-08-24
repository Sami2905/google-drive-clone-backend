import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/components/upload/upload-provider';
import { Upload } from 'lucide-react';
import { UploadProgress } from '@/types';

interface FileUploaderProps {
  currentFolderId?: string;
  onUploadComplete?: (files: any[]) => void;
}

export default function FileUploader({
  currentFolderId,
  onUploadComplete,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addUpload } = useUpload();

  const handleFileSelect = useCallback((files: FileList) => {
    Array.from(files).forEach((file) => {
      addUpload({
        fileId: Math.random().toString(36).substring(7),
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });
    });
  }, [addUpload]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        multiple
        className="hidden"
      />
      <Button onClick={handleClick}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Files
      </Button>
    </>
  );
}