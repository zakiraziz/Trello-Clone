import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCard } from '../api/createCard'
import { useToast } from '../../../../hooks/useToast'

interface AddCardProps {
  listId: string
}

export const AddCard = ({ listId }: AddCardProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const queryClient = useQueryClient()
  const { success } = useToast()

  const { mutate, isPending } = useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
      success('Card created!', { description: 'The task is now part of your board.' })
      setTitle('')
      setIsAdding(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      mutate({ list_id: listId, title: title.trim() })
    }
  }

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="mt-2 w-full rounded-lg border border-dashed border-slate-200 bg-white/70 px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:border-primary hover:text-primary"
        aria-label="Add a card"
      >
        <Plus className="mr-1 inline h-4 w-4" />
        Add a card
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <Input
        autoFocus
        placeholder="Enter card title..."
        aria-label="Card title"
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add Card'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Cancel adding card"
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
