import { useEffect, useRef, useState, useCallback } from 'react'
// @ts-ignore
import { io } from 'socket.io-client'
import { useAuth } from '@/features/auth/hooks/useAuth'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

interface UseSocketIOOptions {
  boardId?: string
  onBoardUpdate?: (data: any) => void
  onCardUpdate?: (data: any) => void
  onListUpdate?: (data: any) => void
}

export const useSocketIO = (options: UseSocketIOOptions = {}) => {
  const { isAuthenticated } = useAuth()
  const socketRef = useRef<any | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { boardId, onBoardUpdate, onCardUpdate, onListUpdate } = options

  useEffect(() => {
    if (!isAuthenticated) return

    const token = localStorage.getItem('token')
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
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

    socket.on('boardUpdated', (data: any) => {
      onBoardUpdate?.(data)
    })

    socket.on('cardUpdated', (data: any) => {
      onCardUpdate?.(data)
    })

    socket.on('listUpdated', (data: any) => {
      onListUpdate?.(data)
    })

    socketRef.current = socket

    return () => {
      if (boardId) {
        socket.emit('leaveBoard', { boardId })
      }
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, boardId, onBoardUpdate, onCardUpdate, onListUpdate])

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data)
  }, [])

  return { isConnected, socket: socketRef.current, emit }
}