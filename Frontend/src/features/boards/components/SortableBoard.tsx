import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SortableList } from './SortableList'
import { List as ListType } from '../types'
import { useMoveList } from '../hooks/useDragAndDrop'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface SortableBoardProps {
  lists: (ListType & { cards?: any[] })[]
  boardId: string
}

export const SortableBoard = ({ lists, boardId }: SortableBoardProps) => {
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { mutate: moveList } = useMoveList()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: any) => {
    setActiveId(null)
    const { active, over } = event

    if (over && active.id !== over.id) {
      const newIndex = lists.findIndex((list) => list.id === over.id)

      moveList({
        listId: active.id,
        position: newIndex,
      })
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeList = activeId ? lists.find((list) => list.id === activeId) : null

  const createList = useMutation({
    mutationFn: async (data: { board_id: string; title: string }) => {
      const response = await api.post('/lists', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      toast.success('List created!')
      setNewListTitle('')
      setIsAddingList(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create list')
    },
  })

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault()
    if (newListTitle.trim()) {
      createList.mutate({ board_id: boardId, title: newListTitle.trim() })
    }
  }

  return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={lists.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {lists.map((list) => (
              <SortableList key={list.id} list={list} isDragging={activeId === list.id} />
            ))}
            {!isAddingList ? (
              <button
                type="button"
                onClick={() => setIsAddingList(true)}
                className="w-80 shrink-0 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 self-start opacity-60 hover:opacity-100"
                aria-label="Add a new list"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add List</span>
              </button>
            ) : (
              <form onSubmit={handleAddList} className="w-80 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg p-3 self-start">
                <Input
                  autoFocus
                  placeholder="Enter list title..."
                  aria-label="List title"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="mb-2"
                  disabled={createList.isPending}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={createList.isPending}>
                    {createList.isPending ? 'Adding...' : 'Add List'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Cancel adding list"
                    onClick={() => {
                      setIsAddingList(false)
                      setNewListTitle('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeList ? (
            <div className="w-80 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-2xl ring-2 ring-primary opacity-90 scale-105 rotate-[2deg]">
              <div className="font-semibold truncate">{activeList.title}</div>
              <div className="mt-2 space-y-2">
                {activeList.cards?.slice(0, 3).map((card) => (
                  <div key={card.id} className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm">
                    {card.title}
                  </div>
                ))}
                {(activeList.cards?.length || 0) > 3 && (
                  <div className="text-xs text-muted-foreground">+{activeList.cards!.length - 3} more cards</div>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
  )
}