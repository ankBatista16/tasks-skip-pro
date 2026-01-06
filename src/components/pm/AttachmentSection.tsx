import { useRef, useState } from 'react'
import { Attachment, User } from '@/types'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Upload,
  Trash2,
  Download,
  FileImage,
  Paperclip,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface AttachmentSectionProps {
  attachments: Attachment[]
  users: User[]
  currentUser: User | null
  onUpload: (file: File) => void
  onDelete: (attachmentId: string) => void
  canDelete?: boolean
  className?: string
}

export function AttachmentSection({
  attachments,
  users,
  currentUser,
  onUpload,
  onDelete,
  canDelete = false,
  className,
}: AttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsUploading(true)

      // Simulate network upload
      setTimeout(() => {
        onUpload(file)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setIsUploading(false)
      }, 1000)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/'))
      return <FileImage className="h-8 w-8 text-purple-500" />
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Attachments</h3>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            className="gap-2"
            disabled={isUploading || !currentUser}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {attachments.map((attachment) => {
          const uploader = users.find((u) => u.id === attachment.userId)
          const isOwner = currentUser?.id === attachment.userId
          const canDeleteThis = canDelete || isOwner

          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors group"
            >
              <div className="shrink-0 p-2 bg-muted rounded-md">
                {getFileIcon(attachment.fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {attachment.fileName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{formatSize(attachment.size)}</span>
                  <span>•</span>
                  <span>
                    Uploaded by {uploader?.name || 'Unknown'}{' '}
                    {formatDistanceToNow(new Date(attachment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
                {canDeleteThis && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {attachments.length === 0 && (
          <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground bg-muted/20">
            <Paperclip className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No attachments found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
