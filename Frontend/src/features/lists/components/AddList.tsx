import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createList } from '../api/createList'
import { useToast } from '../../../../hooks/useToast'

interface AddListProps {
  boardId: string
}

export const AddList = ({ boardId }: AddListProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const queryClient = useQueryClient()
  const { success } = useToast()

  const { mutate, isPending } = useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      success('List created!', { description: 'You can start adding cards right away.' })
      setTitle('')
      setIsAdding(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      mutate({ board_id: boardId, title: title.trim() })
    }
  }

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="flex w-80 shrink-0 items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-primary hover:bg-slate-50 hover:text-primary"
        aria-label="Add a list"
      >
        <Plus className="h-4 w-4" />
        <span>Add List</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-80 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <Input
        autoFocus
        placeholder="Enter list title..."
        aria-label="List title"
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        className="mb-2"
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add List'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Cancel adding list"
          onClick={() => {
            setIsAdding(false)
            setTitle('')
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
