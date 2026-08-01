import { useEffect, useCallback } from 'react'

interface Shortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  enabled?: boolean
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Allow Escape to work inside inputs, but block other single-key shortcuts
      const isInput =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable

      if (isInput && event.key !== 'Escape') {
        // Only block if the shortcut being triggered doesn't have modifiers
        // (Wait, we'll just let the loop handle it by checking modifiers vs isInput)
      }

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue

        const ctrlOrMeta = shortcut.ctrl || shortcut.meta
        const matchesCtrl = ctrlOrMeta ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        
        // If it's an input, and the shortcut doesn't require a modifier (like Ctrl/Cmd), skip it.
        // Unless it's Escape, which we usually want to allow.
        if (isInput && !ctrlOrMeta && shortcut.key !== 'Escape') {
          continue
        }
        const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey
        const matchesAlt = shortcut.alt ? event.altKey : !event.altKey
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                           event.code.toLowerCase() === shortcut.key.toLowerCase()

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          event.preventDefault()
          event.stopPropagation()
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    if (shortcuts.length === 0) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, shortcuts])
}

// Common preset shortcuts for a board page
export const BOARD_SHORTCUTS = {
  NEW_CARD: { key: 'n', ctrl: true, description: 'Add a new card to the selected list' },
  NEW_CARD_QUICK: { key: 'n', description: 'Quickly add a new card' },
  SEARCH: { key: '/', ctrl: true, description: 'Search boards and cards' },
  SEARCH_QUICK: { key: '/', description: 'Search boards and cards' },
  HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
  CLOSE: { key: 'Escape', description: 'Close dialog or cancel editing' },
  ARCHIVE: { key: 'd', ctrl: true, shift: true, description: 'Archive selected item' },
  SAVE: { key: 'Enter', ctrl: true, description: 'Save current form' },
  GO_HOME: { key: 'h', ctrl: true, description: 'Go to dashboard' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh current view' },
} as const