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
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue

        const ctrlOrMeta = shortcut.ctrl || shortcut.meta
        const matchesCtrl = ctrlOrMeta ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
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
  SEARCH: { key: '/', ctrl: true, description: 'Search boards and cards' },
  CLOSE: { key: 'Escape', description: 'Close dialog or cancel editing' },
  ARCHIVE: { key: 'd', ctrl: true, shift: true, description: 'Archive selected item' },
  SAVE: { key: 'Enter', ctrl: true, description: 'Save current form' },
  GO_HOME: { key: 'h', ctrl: true, description: 'Go to dashboard' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh current view' },
} as const