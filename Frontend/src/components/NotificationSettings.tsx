import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Loader2, Bell, Mail } from 'lucide-react'

interface NotificationSettingsProps {
  settings: { email: Record<string, boolean>; in_app: boolean }
  loading: boolean
  onUpdate: (settings: { email?: Record<string, boolean>; in_app?: boolean }) => Promise<boolean>
}

export function NotificationSettings({ settings, loading, onUpdate }: NotificationSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleToggle = (key: string, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value }
    }))
  }

  const handleSave = async () => {
    await onUpdate(localSettings)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <p className="text-sm text-muted-foreground">Choose how you want to be notified about important events</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            In-App Notifications
          </h4>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <span className="text-sm font-medium">Enable notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.in_app}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, in_app: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </h4>
          <div className="space-y-3">
            {Object.entries(localSettings.email).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleToggle(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}