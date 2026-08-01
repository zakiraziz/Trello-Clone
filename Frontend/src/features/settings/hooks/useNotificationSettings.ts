import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

interface NotificationSettings {
  email: Record<string, boolean>
  in_app: boolean
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      welcome: true,
      login_alert: true,
      password_reset: true,
      board_invite: true,
      task_assigned: true,
      mention: true,
      due_date_reminder: true,
      profile_change: true,
    },
    in_app: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/users/notifications')
        setSettings(response.data.notification_settings)
      } catch (error) {
        console.error('Failed to load notification settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
        email: { ...settings.email, ...newSettings.email }
      }
      await api.put('/users/notifications', updatedSettings)
      setSettings(updatedSettings)
      return true
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      return false
    }
  }

  return { settings, loading, updateSettings }
}