import { useState } from 'react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Share2, MoreVertical, Edit2, Trash2, Archive } from 'lucide-react'
import type { Board } from '@/features/boards/types'

interface BoardHeaderProps {
  board: Board
  onRefresh: () => void
}

export function BoardHeader({ board, onRefresh }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(board.name)
  const [showMenu, setShowMenu] = useState(false)

  const handleUpdateTitle = async () => {
    try {
      await api.put(`/boards/${board.id}`, { title })
      setIsEditing(false)
      onRefresh()
    } catch (error) {
      console.error('Failed to update board title:', error)
    }
  }

  const handleArchive = async () => {
    try {
      await api.post(`/boards/${board.id}/archive`)
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Failed to archive board:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/boards/${board.id}`)
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Failed to delete board:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleUpdateTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                className="text-lg font-semibold"
                autoFocus
              />
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {board.name}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {board.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
              {board.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          
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
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      handleArchive()
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                  <button
                    onClick={() => {
                      handleDelete()
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}