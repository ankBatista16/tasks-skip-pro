import { useState } from 'react'
import { Comment, User } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { Send, MessageSquare } from 'lucide-react'

interface CommentSectionProps {
  comments: Comment[]
  users: User[]
  currentUser: User | null
  onAddComment: (content: string) => void
  className?: string
}

export function CommentSection({
  comments,
  users,
  currentUser,
  onAddComment,
  className,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser) return

    setIsSubmitting(true)
    // Simulate network delay for feedback
    setTimeout(() => {
      onAddComment(newComment)
      setNewComment('')
      setIsSubmitting(false)
    }, 500)
  }

  // Sort comments by createdAt descending (newest first)
  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {sortedComments.map((comment) => {
          const author = users.find((u) => u.id === comment.userId)
          return (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={author?.avatarUrl} />
                <AvatarFallback>{author?.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {author?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="text-sm text-foreground/90 bg-muted/40 p-3 rounded-lg rounded-tl-none">
                  {comment.content}
                </div>
              </div>
            </div>
          )
        })}

        {sortedComments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No comments yet. Be the first to start the discussion!</p>
          </div>
        )}
      </div>
    </div>
  )
}
