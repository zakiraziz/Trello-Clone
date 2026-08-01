import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  { keys: ['N'], description: 'New card' },
  { keys: ['?'], description: 'Toggle shortcuts help' },
  { keys: ['Escape'], description: 'Close modal / Cancel editing' },
  { keys: ['Enter'], description: 'Save / Confirm' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['B'], description: 'Open board' },
  { keys: ['D'], description: 'Go to dashboard' },
]

export const ShortcutsModal = ({ isOpen, onClose }: ShortcutsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded-md"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}