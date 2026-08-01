import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import { useSocketIO } from '@/hooks/useSocketIO'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, X, Plus, Trash2, Calendar, User, Paperclip, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import type { Card as CardType, Comment, Checklist } from '../types'

interface CardModalProps {
  card: CardType
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function CardModal({ card, isOpen, onClose, onUpdate }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [comments, setComments] = useState<Comment[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [saving, setSaving] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const { user } = useAuth()

  // Real-time updates
  useSocketIO({
    onCardUpdate: (data: unknown) => {
      const updateData = data as { cardId: string; type: string }
      if (updateData.cardId === card.id && updateData.type === 'updated') {
        onUpdate()
      }
    },
    onCommentUpdate: (data: unknown) => {
      const commentData = data as { cardId: string }
      if (commentData.cardId === card.id) {
        fetchComments()
      }
    }
  })

  useEffect(() => {
    if (isOpen) {
      setTitle(card.title)
      setDescription(card.description || '')
      fetchComments()
      fetchChecklists()
    }
  }, [isOpen, card.id])

  const fetchComments = async () => {
    try {
      const response = await api.get(`/cards/${card.id}/comments`)
      setComments(response.data.comments || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const fetchChecklists = async () => {
    try {
      const response = await api.get(`/cards/${card.id}/checklists`)
      setChecklists(response.data.checklists || [])
    } catch (error) {
      console.error('Failed to fetch checklists:', error)
    }
  }

  const handleSaveDetails = async () => {
    setSaving(true)
    try {
      await api.put(`/cards/${card.id}`, { title, description })
      onUpdate()
    } catch (error) {
      console.error('Failed to update card:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await api.post(`/cards/${card.id}/comments`, { text: newComment.trim() })
      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/cards/${card.id}/comments/${commentId}`)
      fetchComments()
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChecklistTitle.trim()) return

    try {
      await api.post(`/cards/${card.id}/checklists`, { title: newChecklistTitle.trim() })
      setNewChecklistTitle('')
      fetchChecklists()
    } catch (error) {
      console.error('Failed to add checklist:', error)
    }
  }

  const handleToggleChecklistItem = async (checklistId: string, itemId: string, completed: boolean) => {
    try {
      await api.put(`/cards/${card.id}/checklists/${checklistId}/items/${itemId}`, { completed })
      fetchChecklists()
    } catch (error) {
      console.error('Failed to update checklist item:', error)
    }
  }

  const handleDeleteCard = async () => {
    if (!confirm('Are you sure you want to delete this card?')) return

    try {
      await api.delete(`/cards/${card.id}`)
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-semibold pr-8">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveDetails}
                className="text-xl font-semibold border-none p-0 focus-visible:ring-0"
                placeholder="Card title"
              />
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 mt-4">
            <TabsContent value="details" className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveDetails}
                  placeholder="Add a description..."
                  className="mt-2 min-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
<div>
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </Label>
                <Input
                  type="date"
                  className="mt-2"
                  defaultValue={card.due_date || ''}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assignee
                </Label>
                  <select className="mt-2 w-full px-3 py-2 border rounded-md">
                    <option value="">Unassigned</option>
                    <option value={user?.id}>{user?.name}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="destructive" onClick={handleDeleteCard}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Card
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{comment.author?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No comments yet</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-4 border-t">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!newComment.trim()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="checklists" className="space-y-4">
              <div className="space-y-3">
                {checklists.map((checklist) => (
                  <Card key={checklist.id}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">{checklist.title}</h4>
                      <div className="space-y-2">
                        {checklist.items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={(e) => handleToggleChecklistItem(checklist.id, item.id, e.target.checked)}
                              className="h-4 w-4"
                            />
                            <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <form onSubmit={handleAddChecklist} className="flex gap-2 pt-4 border-t">
                <Input
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="Add a checklist..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!newChecklistTitle.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Paperclip className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Drag and drop files here or click to upload</p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {saving && (
          <div className="absolute top-4 right-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}