import { useState } from 'react'
import { api } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Send, Clock } from 'lucide-react'

interface Comment {
  id: string
  text: string
  author: { id: string; name: string; avatar?: string }
  createdAt: string
}

interface CardCommentsProps {
  cardId: string
  comments: Comment[]
  onCommentAdded: (comment: Comment) => void
}

export const CardComments = ({ cardId, comments, onCommentAdded }: CardCommentsProps) => {
  const { user } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      const { data } = await api.post(`/cards/${cardId}/comments`, { text: newComment })
      onCommentAdded(data)
      setNewComment('')
      toast.success('Comment added')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        💬 Comments ({comments.length})
      </h4>

      {/* Comment List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#61BD4F] to-[#00A3BF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {comment.author.name[0]}
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{comment.author.name}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#61BD4F] to-[#00A3BF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {user?.name?.[0] || 'U'}
        </div>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) handleSubmit()
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Cmd+Enter to post</span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="gap-1"
            >
              <Send className="w-4 h-4" />
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}