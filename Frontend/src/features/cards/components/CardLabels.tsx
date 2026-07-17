import { useState } from 'react'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { X, Tag } from 'lucide-react'

const LABEL_COLORS = [
  { name: 'High Priority', color: '#EB5A46', bg: '#fef2f2' },
  { name: 'Medium', color: '#F2D600', bg: '#fefce8' },
  { name: 'Low Priority', color: '#61BD4F', bg: '#f0fdf4' },
  { name: 'Design', color: '#FF9F1A', bg: '#fff7ed' },
  { name: 'Bug', color: '#C377E0', bg: '#faf5ff' },
  { name: 'Feature', color: '#00A3BF', bg: '#ecfeff' },
  { name: 'Research', color: '#838C91', bg: '#f8fafc' },
  { name: 'Done', color: '#61BD4F', bg: '#f0fdf4' },
]

interface Label {
  id: string
  name: string
  color: string
}

interface CardLabelsProps {
  cardId: string
  labels: Label[]
  onUpdate: (labels: Label[]) => void
}

export const CardLabels = ({ cardId, labels, onUpdate }: CardLabelsProps) => {
  const [showPicker, setShowPicker] = useState(false)

  const toggleLabel = async (labelDef: typeof LABEL_COLORS[0]) => {
    const exists = labels.find((l) => l.name === labelDef.name)
    let updated: Label[]

    if (exists) {
      updated = labels.filter((l) => l.name !== labelDef.name)
    } else {
      updated = [...labels, { id: Date.now().toString(), name: labelDef.name, color: labelDef.color }]
    }

    onUpdate(updated)
    try {
      await api.patch(`/cards/${cardId}/labels`, { labels: updated })
    } catch {
      toast.error('Failed to update labels')
    }
  }

  const removeLabel = (labelId: string) => {
    onUpdate(labels.filter((l) => l.id !== labelId))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Labels
        </h4>
      </div>

      {/* Selected Labels */}
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: LABEL_COLORS.find((l) => l.name === label.name)?.bg || '#f3f4f6', color: label.color }}
            onClick={() => removeLabel(label.id)}
          >
            {label.name}
            <X className="w-3 h-3" />
          </span>
        ))}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          + Add Label
        </button>
      </div>

      {/* Label Picker */}
      {showPicker && (
        <div className="p-3 bg-white border rounded-lg shadow-lg space-y-2">
          <div className="text-xs font-medium text-gray-500 mb-2">Select labels:</div>
          <div className="grid grid-cols-2 gap-2">
            {LABEL_COLORS.map((label) => {
              const isSelected = labels.some((l) => l.name === label.name)
              return (
                <button
                  key={label.name}
                  onClick={() => toggleLabel(label)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isSelected ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: label.bg,
                    color: label.color,
                    ...(isSelected ? { '--tw-ring-color': label.color } as React.CSSProperties : {}),
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                  {isSelected && <span className="ml-auto">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}