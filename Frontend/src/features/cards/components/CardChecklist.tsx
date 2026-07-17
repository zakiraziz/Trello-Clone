import { useState } from 'react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Plus, Trash2, CheckSquare } from 'lucide-react'

interface CheckItem {
  id: string
  text: string
  completed: boolean
}

interface Checklist {
  id: string
  title: string
  items: CheckItem[]
}

interface CardChecklistProps {
  cardId: string
  checklists: Checklist[]
  onUpdate: (checklists: Checklist[]) => void
}

export const CardChecklist = ({ cardId, checklists, onUpdate }: CardChecklistProps) => {
  const [newItemText, setNewItemText] = useState('')
  const [activeChecklist, setActiveChecklist] = useState<string | null>(null)

  const totalItems = checklists.reduce((sum, cl) => sum + cl.items.length, 0)
  const completedItems = checklists.reduce(
    (sum, cl) => sum + cl.items.filter((i) => i.completed).length,
    0
  )
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  const toggleItem = async (checklistId: string, itemId: string) => {
    const updated = checklists.map((cl) =>
      cl.id === checklistId
        ? {
            ...cl,
            items: cl.items.map((item) =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            ),
          }
        : cl
    )
    onUpdate(updated)
    try {
      await api.patch(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}/toggle`)
    } catch {
      toast.error('Failed to update')
    }
  }

  const addItem = async (checklistId: string) => {
    if (!newItemText.trim()) return
    const newItem: CheckItem = {
      id: Date.now().toString(),
      text: newItemText,
      completed: false,
    }
    const updated = checklists.map((cl) =>
      cl.id === checklistId ? { ...cl, items: [...cl.items, newItem] } : cl
    )
    onUpdate(updated)
    setNewItemText('')
    setActiveChecklist(null)
  }

  const deleteItem = (checklistId: string, itemId: string) => {
    const updated = checklists.map((cl) =>
      cl.id === checklistId ? { ...cl, items: cl.items.filter((i) => i.id !== itemId) } : cl
    )
    onUpdate(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          Checklist
        </h4>
        <span className="text-xs font-medium text-gray-500">
          {completedItems}/{totalItems}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-[#61BD4F] h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 text-right">{progress}% complete</div>

      {/* Checklist Items */}
      {checklists.map((checklist) => (
        <div key={checklist.id} className="space-y-2">
          {checklist.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 group p-2 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem(checklist.id, item.id)}
                className={item.completed ? 'bg-[#61BD4F] border-[#61BD4F]' : ''}
              />
              <span
                className={`text-sm flex-1 ${
                  item.completed ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => deleteItem(checklist.id, item.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add Item Input */}
          {activeChecklist === checklist.id ? (
            <div className="flex gap-2 mt-2">
              <Input
                autoFocus
                placeholder="Add an item..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem(checklist.id)}
                className="flex-1"
              />
              <Button size="sm" onClick={() => addItem(checklist.id)}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setActiveChecklist(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setActiveChecklist(checklist.id)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add an item
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}