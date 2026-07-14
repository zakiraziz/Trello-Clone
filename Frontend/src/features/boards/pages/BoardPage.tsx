
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Star, Share2, Palette, Copy, Archive, Trash2, Edit2 } from 'lucide-react';
import { useBoard } from '../hooks/useBoard';
import { SortableBoard } from '../components/SortableBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useState } from 'react';
import { useButtonHandler } from '@/utils/useButtonHandler';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export const BoardPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: board, isLoading } = useBoard(id!)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(board?.name || '')
  const [isStarred, setIsStarred] = useState(false)

  // Update board mutation (name/description)
  const updateBoard = useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      const response = await api.put(`/boards/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] })
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      toast.success('Board updated!')
      setIsEditingName(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update board')
      setEditName(board?.name || '')
      setIsEditingName(false)
    },
  })

  // Archive board handler using useButtonHandler
  const archiveHandler = useButtonHandler({
    asyncAction: async () => {
      const response = await api.put(`/boards/${id}`, { is_archived: true })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', id] })
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      toast.success('Board archived!')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to archive board')
    },
  })

  // Delete board handler using useButtonHandler
  const deleteHandler = useButtonHandler({
    asyncAction: async () => {
      await api.delete(`/boards/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      toast.success('Board deleted!')
      navigate('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete board')
    },
  })

  const isOwner = board?.owner_id === user?.id

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_42%)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-full rounded-3xl bg-slate-200" />
            <div className="flex gap-4">
              <div className="h-64 w-80 rounded-2xl bg-slate-200" />
              <div className="h-64 w-80 rounded-2xl bg-slate-200" />
              <div className="h-64 w-80 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Board not found</p>
          <p className="mt-2 text-sm text-slate-600">That board may have been removed or is no longer available.</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to boards
          </Button>
        </div>
      </div>
    )
  }

  const handleNameChange = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editName.trim() && editName !== board.name) {
        updateBoard.mutate({ name: editName.trim() })
      } else {
        setIsEditingName(false)
        setEditName(board.name)
      }
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
      setEditName(board.name)
    }
  }

  const handleNameBlur = () => {
    if (editName.trim() && editName !== board.name) {
      updateBoard.mutate({ name: editName.trim() })
    } else {
      setIsEditingName(false)
      setEditName(board.name)
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: board.name, url: shareUrl })
        toast.success('Board shared')
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Board link copied to clipboard')
      }
    } catch {
      toast.error('Unable to share board right now')
    }
  }

  const handleToggleStar = () => {
    setIsStarred((current) => {
      const next = !current
      toast.success(next ? 'Board starred' : 'Board unstarred')
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_42%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Board</p>
                {isEditingName ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleNameBlur}
                    onKeyDown={handleNameChange}
                    autoFocus
                    className="w-64"
                  />
                ) : (
                  <h1
                    className="text-2xl font-semibold text-slate-900 cursor-pointer hover:text-primary"
                    onClick={() => isOwner && setIsEditingName(true)}
                    onDoubleClick={() => isOwner && setIsEditingName(true)}
                  >
                    {board.name}
                  </h1>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleToggleStar}>
                <Star className={`h-4 w-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {isStarred ? 'Starred' : 'Star'}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Board Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Rename Board
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Board background options will be available soon')}>
                    <Palette className="w-4 h-4 mr-2" />
                    Change Background
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { void navigator.clipboard.writeText(`${window.location.href} (${board.name})`); toast.success('Board details copied') }}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Board
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={archiveHandler.onClick}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Board
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem onClick={deleteHandler.onClick} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Board
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {board.description && (
            <p className="mt-3 max-w-2xl text-sm text-slate-600">{board.description}</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur min-h-[600px]">
          <SortableBoard
            lists={board.lists || []}
            boardId={board.id}
          />
        </div>
      </div>
    </div>
  )
}