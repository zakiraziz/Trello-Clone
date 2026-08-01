import { useState } from 'react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/features/cards/components/Card'
import { AddCard } from '@/features/cards/components/AddCard'
import { MoreVertical, Edit2, Trash2, Archive } from 'lucide-react'
import type { List } from '@/features/boards/types'

interface SortableBoardProps {
  list: List
  boardId: string
  onUpdateList: (listId: string, title: string) => void
  onDeleteList: (listId: string) => void
  onArchiveList: (listId: string) => void
}

export function SortableBoard({ list, boardId, onUpdateList, onDeleteList, onArchiveList }: SortableBoardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [showMenu, setShowMenu] = useState(false)

  const handleUpdateTitle = async () => {
    if (title.trim() && title !== list.title) {
      await onUpdateList(list.id, title.trim())
    }
    setIsEditing(false)
  }

  const handleAddCard = async (cardTitle: string) => {
    try {
      await api.post(`/cards`, {
        list_id: list.id,
        board_id: boardId,
        title: cardTitle
      })
      // Refresh will be handled by Socket.io
    } catch (error) {
      console.error('Failed to create card:', error)
    }
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-3">
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
            className="font-semibold"
            autoFocus
          />
        ) : (
          <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
            {list.title}
          </h3>
        )}
        
        {!isEditing && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      onArchiveList(list.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                  <button
                    onClick={() => {
                      onDeleteList(list.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {list.cards?.map((card) => (
          <Card key={card.id} card={card} boardId={boardId} listId={list.id} />
        ))}
      </div>

      <AddCard onAdd={handleAddCard} />
    </div>
  )
}