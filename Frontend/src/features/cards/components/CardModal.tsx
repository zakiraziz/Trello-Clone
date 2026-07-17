import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { X, Users } from 'lucide-react'
import { CardComments } from './CardComments'
import { CardChecklist } from './CardChecklist'
import { CardLabels } from './CardLabels'
import { useOnlineUsers } from '@/hooks/useOnlineUsers'

interface CardModalProps {
  card: {
    id: string
    title: string
    description?: string
    list_id: string
    board_id: string
    labels?: Array<{ id: string; name: string; color: string }>
    checklists?: Array<{
      id: string
      title: string
      items: Array<{ id: string; text: string; completed: boolean }>
    }>
    comments?: Array<{
      id: string
      text: string
      author: { id: string; name: string; avatar?: string }
      createdAt: string
    }>
  }
  isOpen: boolean
  onClose: () => void
  onUpdate: (card: any) => void
}

export const CardModal = ({ card, isOpen, onClose, onUpdate }: CardModalProps) => {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  
  const onlineCount = useOnlineUsers(card.board_id)
  const [labels, setLabels] = useState(card.labels || [])
  const [checklists, setChecklists] = useState(card.checklists || [])
  const [comments, setComments] = useState(card.comments || [])

  useEffect(() => {
    setTitle(card.title)
    setDescription(card.description || '')
    setLabels(card.labels || [])
    setChecklists(card.checklists || [])
    setComments(card.comments || [])
  }, [card])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.patch(`/cards/${card.id}`, { title, description })
      onUpdate({ ...card, title, description })
      toast.success('Card updated')
    } catch {
      toast.error('Failed to update card')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLabelsUpdate = (newLabels: any[]) => {
    setLabels(newLabels)
  }

  const handleChecklistUpdate = (newChecklists: any[]) => {
    setChecklists(newChecklists)
  }

  const handleCommentAdded = (comment: any) => {
    setComments([...comments, comment])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#026AA7]" />
              <span className="text-sm text-gray-500">{onlineCount} online</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Title</label>
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold resize-none"
                rows={1}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="resize-none"
                rows={4}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === 'details' ? 'border-b-2 border-[#026AA7] text-[#026AA7]' : 'text-gray-500'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('checklist')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === 'checklist' ? 'border-b-2 border-[#026AA7] text-[#026AA7]' : 'text-gray-500'
                }`}
              >
                Checklist
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === 'comments' ? 'border-b-2 border-[#026AA7] text-[#026AA7]' : 'text-gray-500'
                }`}
              >
                Comments
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <CardLabels cardId={card.id} labels={labels} onUpdate={handleLabelsUpdate} />
            </div>
          )}

          {activeTab === 'checklist' && (
            <CardChecklist cardId={card.id} checklists={checklists} onUpdate={handleChecklistUpdate} />
          )}

          {activeTab === 'comments' && (
            <CardComments cardId={card.id} comments={comments} onCommentAdded={handleCommentAdded} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}