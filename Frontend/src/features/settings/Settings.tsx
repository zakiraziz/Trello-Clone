import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Bell, Palette, Globe } from 'lucide-react'

interface Settings {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
  }
}

export function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchSettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const response = await api.get('/users/settings')
      setSettings(response.data.settings || {
        theme: 'system',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: {
          email: true,
          push: true,
          desktop: true
        }
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    if (!settings) return
    setSaving(true)
    try {
      const newSettings = { ...settings, [key]: value }
      await api.put('/users/settings', newSettings)
      setSettings(newSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateNotification = async (key: string, value: boolean) => {
    if (!settings) return
    setSaving(true)
    try {
      const newSettings = {
        ...settings,
        notifications: { ...settings.notifications, [key]: value }
      }
      await api.put('/users/settings', newSettings)
      setSettings(newSettings)
    } catch (error) {
      console.error('Failed to update notification settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!settings) {
    return <div className="text-center text-muted-foreground">Failed to load settings</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="theme" className="font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
                disabled={saving}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="language" className="font-medium">Language</Label>
                <p className="text-sm text-muted-foreground">Select your preferred language</p>
              </div>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
                disabled={saving}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="timezone" className="font-medium">Timezone</Label>
                <p className="text-sm text-muted-foreground">Your current timezone</p>
              </div>
              <span className="text-sm text-muted-foreground">{settings.timezone}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notif" className="font-medium">Email notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="email-notif"
                checked={settings.notifications.email}
                onCheckedChange={(checked) => updateNotification('email', checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notif" className="font-medium">Push notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
              <Switch
                id="push-notif"
                checked={settings.notifications.push}
                onCheckedChange={(checked) => updateNotification('push', checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="desktop-notif" className="font-medium">Desktop notifications</Label>
                <p className="text-sm text-muted-foreground">Show desktop notifications</p>
              </div>
              <Switch
                id="desktop-notif"
                checked={settings.notifications.desktop}
                onCheckedChange={(checked) => updateNotification('desktop', checked)}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {saving && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </div>
  )
}