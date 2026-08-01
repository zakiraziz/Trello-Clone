import { useEffect, useRef, useState, useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const io = require('socket.io-client').io
import { useAuth } from '@/hooks/useAuth'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

interface UseSocketIOOptions {
  boardId?: string
  onBoardUpdate?: (data: unknown) => void
  onCardUpdate?: (data: unknown) => void
  onListUpdate?: (data: unknown) => void
  onCommentUpdate?: (data: unknown) => void
  onChecklistUpdate?: (data: unknown) => void
  onLabelUpdate?: (data: unknown) => void
  onMemberUpdate?: (data: unknown) => void
  onOnlineUsers?: (data: unknown) => void
  onUserTyping?: (data: unknown) => void
}

export const useSocketIO = (options: UseSocketIOOptions = {}) => {
  const { isAuthenticated } = useAuth()
  const socketRef = useRef<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const { 
    boardId, 
    onBoardUpdate, 
    onCardUpdate, 
    onListUpdate,
    onCommentUpdate,
    onChecklistUpdate,
    onLabelUpdate,
    onMemberUpdate,
    onOnlineUsers,
    onUserTyping
  } = options

  useEffect(() => {
    if (!isAuthenticated) return

    const token = localStorage.getItem('token')
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    })

    socket.on('connect', () => {
      setIsConnected(true)
      if (boardId) {
        socket.emit('joinBoard', { boardId })
      }
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message)
      setIsConnected(false)
    })

    // Board events
    socket.on('boardUpdated', (data: unknown) => {
      onBoardUpdate?.({ ...data as object, type: 'updated' })
    })
    socket.on('boardDeleted', (data: unknown) => {
      onBoardUpdate?.({ ...data as object, type: 'deleted' })
    })
    socket.on('boardShared', (data: unknown) => {
      onMemberUpdate?.(data)
    })

    // List events
    socket.on('listCreated', (data: unknown) => {
      onListUpdate?.({ ...data as object, type: 'created' })
    })
    socket.on('listUpdated', (data: unknown) => {
      onListUpdate?.({ ...data as object, type: 'updated' })
    })
    socket.on('listDeleted', (data: unknown) => {
      onListUpdate?.({ ...data as object, type: 'deleted' })
    })
    socket.on('listsReordered', (data: unknown) => {
      onListUpdate?.({ ...data as object, type: 'reordered' })
    })

    // Card events
    socket.on('cardCreated', (data: unknown) => {
      onCardUpdate?.({ ...data as object, type: 'created' })
    })
    socket.on('cardUpdated', (data: unknown) => {
      onCardUpdate?.({ ...data as object, type: 'updated' })
    })
    socket.on('cardDeleted', (data: unknown) => {
      onCardUpdate?.({ ...data as object, type: 'deleted' })
    })
    socket.on('cardMoved', (data: unknown) => {
      onCardUpdate?.({ ...data as object, type: 'moved' })
    })

    // Comment events
    socket.on('commentAdded', (data: unknown) => {
      onCommentUpdate?.({ ...data as object, type: 'added' })
    })

    // Checklist events
    socket.on('checklistCreated', (data: unknown) => {
      onChecklistUpdate?.({ ...data as object, type: 'created' })
    })
    socket.on('checklistItemToggled', (data: unknown) => {
      onChecklistUpdate?.({ ...data as object, type: 'toggled' })
    })

    // Label events
    socket.on('labelsUpdated', (data: unknown) => {
      onLabelUpdate?.({ ...data as object, type: 'updated' })
    })

    // User events
    socket.on('online-users', (data: unknown) => {
      if (data && typeof data === 'object' && 'count' in data) {
        setOnlineUsers((data as { count: number }).count)
      }
      onOnlineUsers?.(data)
    })

    socket.on('userTyping', (data: unknown) => {
      onUserTyping?.(data)
    })

    socketRef.current = socket

    return () => {
      if (boardId) {
        socket.emit('leaveBoard', { boardId })
      }
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, boardId, onBoardUpdate, onCardUpdate, onListUpdate, onCommentUpdate, onChecklistUpdate, onLabelUpdate, onMemberUpdate, onOnlineUsers, onUserTyping])

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  const emitTyping = useCallback((boardId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { boardId, isTyping })
  }, [])

  return { isConnected, socket: socketRef.current, emit, emitTyping, onlineUsers }
}