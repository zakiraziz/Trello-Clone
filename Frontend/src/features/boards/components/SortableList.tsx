import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import { Card } from '@/features/cards/components/Card'
import { AddCard } from '@/features/cards/components/AddCard'
import { List as ListType } from '../types'
import { Card as CardType } from '@/features/boards/types'
import { useMoveCard } from '../hooks/useDragAndDrop'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface SortableListProps {
  list: ListType & { cards?: CardType[] }
}

export const SortableList = ({ list }: SortableListProps) => {
  const { mutate: moveCard, isPending: isMovingCard } = useMoveCard()
  const queryClient = useQueryClient()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)

  const updateListTitle = useMutation({
    mutationFn: async (data: { title: string }) => {
      const response = await api.put(`/lists/${list.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
      setIsEditingTitle(false)
      toast.success('List updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update list')
      setEditTitle(list.title)
      setIsEditingTitle(false)
    },
  })

  const deleteList = useMutation({
    mutationFn: async () => {
      await api.delete(`/lists/${list.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
      toast.success('List deleted!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete list')
    },
  })

  return (
    <div className="w-80 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        {isEditingTitle ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              if (editTitle.trim() && editTitle !== list.title) {
                updateListTitle.mutate({ title: editTitle.trim() })
              } else {
                setIsEditingTitle(false)
                setEditTitle(list.title)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editTitle.trim() && editTitle !== list.title) {
                  updateListTitle.mutate({ title: editTitle.trim() })
                } else {
                  setIsEditingTitle(false)
                }
              } else if (e.key === 'Escape') {
                setEditTitle(list.title)
                setIsEditingTitle(false)
              }
            }}
            autoFocus
            className="flex-1"
          />
        ) : (
          <h3
            className="font-semibold truncate cursor-pointer hover:text-primary"
            onClick={() => setIsEditingTitle(true)}
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {list.title}
          </h3>
        )}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {list.cards?.length || 0}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-1 rounded hover:bg-muted transition-colors" aria-label={`List actions for ${list.title}`}>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteList.mutate()} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        <SortableContext
          items={list.cards?.map((c) => c.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {list.cards?.map((card, index) => (
            <SortableCard
              key={card.id}
              card={card}
              listId={list.id}
              index={index}
              onMove={moveCard}
              isMoving={isMovingCard}
            />
          ))}
        </SortableContext>
        <AddCard listId={list.id} />
      </div>
    </div>
  )
}

interface SortableCardProps {
  card: CardType
  listId: string
  index: number
  onMove: (data: { cardId: string; listId: string; position: number }) => void
  isMoving: boolean
}

const SortableCard = ({ card, listId, index: _index, onMove: _onMove, isMoving: _isMoving }: SortableCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { listId, card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-700 rounded p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5"
          aria-label={`Drag card ${card.title}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <Card card={card} />
        </div>
      </div>
    </div>
  )
}