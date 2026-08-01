import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { api } from '../lib/api-client'

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  readAt?: string
  createdAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: (limit?: number, offset?: number) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  addNotification: (notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'readAt' | 'createdAt'>) => void
  getNotificationSettings: () => Promise<{ email: Record<string, boolean>; in_app: boolean }>
  updateNotificationSettings: (settings: { email?: Record<string, boolean>; in_app?: boolean }) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export { NotificationContext }

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async (limit = 50, offset = 0) => {
    setIsLoading(true)
    try {
      const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`)
      const data = response.data
      
      setNotifications(prev => {
        const newNotifications = data.notifications || []
        if (offset === 0) {
          return newNotifications
        }
        return [...prev, ...newNotifications]
      })
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [])

  const clearAll = useCallback(async () => {
    try {
      await api.delete('/notifications')
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'readAt' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      userId: 'current',
      isRead: false,
      createdAt: new Date().toISOString()
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  const getNotificationSettings = useCallback(async () => {
    try {
      const response = await api.get('/users/notifications')
      return response.data.notification_settings || { email: {}, in_app: true }
    } catch (error) {
      console.error('Failed to get notification settings:', error)
      return { email: {}, in_app: true }
    }
  }, [])

  const updateNotificationSettings = useCallback(async (settings: { email?: Record<string, boolean>; in_app?: boolean }) => {
    try {
      await api.put('/users/notifications', settings)
    } catch (error) {
      console.error('Failed to update notification settings:', error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        getNotificationSettings,
        updateNotificationSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}