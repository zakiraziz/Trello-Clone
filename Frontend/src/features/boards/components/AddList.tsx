import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

interface AddListProps {
  onAdd: (title: string) => void
}

export function AddList({ onAdd }: AddListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(title.trim())
      setTitle('')
      setIsAdding(false)
    }
  }

  if (isAdding) {
    return (
      <div className="flex-shrink-0 w-80">
        <form onSubmit={handleSubmit} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter list title..."
            className="mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              Add List
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setTitle('')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 w-80">
      <Button
        variant="ghost"
        className="w-full h-12 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-5 w-5 mr-2" />
        Add another list
      </Button>
    </div>
  )
}