import { toast } from 'sonner'

interface UndoToastOptions {
  message: string
  description?: string
  undoAction: () => Promise<void> | void
  onSuccess?: () => void
  onError?: (error: unknown) => void
  duration?: number
}

/**
 * Shows a toast with an Undo button for destructive actions.
 * If the user clicks Undo, the undoAction is called.
 * If the toast expires without undo, the action is finalized.
 */
export const showUndoToast = ({
  message,
  description,
  undoAction,
  onSuccess,
  onError,
  duration = 8000,
}: UndoToastOptions) => {
  let resolved = false

  const undo = async () => {
    if (resolved) return
    resolved = true
    try {
      await undoAction()
      onSuccess?.()
      toast.success('Action undone', { duration: 3000 })
    } catch (error) {
      onError?.(error)
      toast.error('Failed to undo action')
    }
  }

  // Show the main toast with an Undo button
  toast(message, {
    description,
    duration,
    action: {
      label: 'Undo',
      onClick: undo,
    },
  })

  // Auto-finalize after the duration
  setTimeout(() => {
    resolved = true
  }, duration)
}