import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useSocketIO } from '@/hooks/useSocketIO'
import { BoardHeader } from '../components/BoardHeader'
import { SortableBoard } from '../components/SortableBoard'
import { AddList } from '../components/AddList'
import { Loader2 } from 'lucide-react'
import type { Board, List } from '@/features/boards/types'

export function BoardPage() {
  const [board, setBoard] = useState<Board | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const boardId = window.location.pathname.split('/')[2]

  useEffect(() => {
    if (boardId) {
      fetchBoard()
      fetchLists()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  // Real-time updates via Socket.io
  useSocketIO({
    onBoardUpdate: (data: unknown) => {
      const updateData = data as { boardId: string }
      if (updateData.boardId === boardId) {
        fetchBoard()
        fetchLists()
      }
    },
    onListUpdate: (data: unknown) => {
      const listData = data as { boardId: string }
      if (listData.boardId === boardId) {
        fetchLists()
      }
    },
    onCardUpdate: (data: unknown) => {
      const cardData = data as { boardId: string }
      if (cardData.boardId === boardId) {
        fetchLists()
      }
    }
  })

  const fetchBoard = async () => {
    try {
      const response = await api.get(`/boards/${boardId}`)
      setBoard(response.data)
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { message?: string } } }
      setError(errorData.response?.data?.message || 'Failed to load board')
    }
  }

  const fetchLists = async () => {
    try {
      const response = await api.get(`/boards/${boardId}/lists`)
      setLists(response.data.lists || [])
    } catch (err: any) {
      console.error('Failed to load lists:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddList = async (title: string) => {
    try {
      const response = await api.post(`/boards/${boardId}/lists`, { title })
      setLists([...lists, response.data])
    } catch (err: any) {
      console.error('Failed to create list:', err)
    }
  }

  const handleUpdateList = async (listId: string, title: string) => {
    try {
      await api.put(`/lists/${listId}`, { title })
      setLists(lists.map(list => list.id === listId ? { ...list, title } : list))
    } catch (err: any) {
      console.error('Failed to update list:', err)
    }
  }

  const handleDeleteList = async (listId: string) => {
    try {
      await api.delete(`/lists/${listId}`)
      setLists(lists.filter(list => list.id !== listId))
    } catch (err: any) {
      console.error('Failed to delete list:', err)
    }
  }

  const handleArchiveList = async (listId: string) => {
    try {
      await api.post(`/lists/${listId}/archive`)
      setLists(lists.filter(list => list.id !== listId))
    } catch (err: any) {
      console.error('Failed to archive list:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">{error || 'Board not found'}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <BoardHeader board={board} onRefresh={fetchBoard} />
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 h-full">
          {lists.map(list => (
            <div key={list.id} className="flex-shrink-0 w-80">
              <SortableBoard
                list={list}
                boardId={boardId}
                onUpdateList={handleUpdateList}
                onDeleteList={handleDeleteList}
                onArchiveList={handleArchiveList}
              />
            </div>
          ))}
          
          <AddList onAdd={handleAddList} />
        </div>
      </div>
    </div>
  )
}