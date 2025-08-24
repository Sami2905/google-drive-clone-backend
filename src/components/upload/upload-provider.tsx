import { createContext, useContext, useState } from 'react'
import { UploadProgress } from '@/types'

interface UploadContextType {
  uploads: UploadProgress[]
  addUpload: (upload: UploadProgress) => void
  updateUpload: (fileId: string, progress: Partial<UploadProgress>) => void
  removeUpload: (fileId: string) => void
  clearCompleted: () => void
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const addUpload = (upload: UploadProgress) => {
    setUploads(prev => [...prev, upload])
  }

  const updateUpload = (fileId: string, progress: Partial<UploadProgress>) => {
    setUploads(prev =>
      prev.map(upload =>
        upload.fileId === fileId ? { ...upload, ...progress } : upload
      )
    )
  }

  const removeUpload = (fileId: string) => {
    setUploads(prev => prev.filter(upload => upload.fileId !== fileId))
  }

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'))
  }

  return (
    <UploadContext.Provider
      value={{ uploads, addUpload, updateUpload, removeUpload, clearCompleted }}
    >
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider')
  }
  return context
}
