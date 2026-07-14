import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User, Camera, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/lib/api-client'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export const Profile = () => {
  const { user, login, logout } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'account'>('profile')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.put('/users/profile', data)
      return response.data
    },
    onSuccess: (data) => {
      const token = localStorage.getItem('token') || ''
      login(token, { ...(user || {}), ...data } as any)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Profile updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await api.put('/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      return response.data
    },
    onSuccess: () => {
      passwordForm.reset()
      toast.success('Password updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update password')
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      setAvatarPreview(base64)
      try {
        await api.put('/users/avatar', { avatar: base64 })
        const token = localStorage.getItem('token') || ''
        login(token, { ...(user || {}), avatar: base64 } as any)
        toast.success('Avatar updated!')
      } catch {
        toast.error('Failed to upload avatar')
      }
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      return
    }
    try {
      await api.delete('/users/account')
      logout()
      toast.success('Account deleted')
      window.location.href = '/login'
    } catch {
      toast.error('Failed to delete account')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="relative mb-6">
              {isUploading ? (
                <div className="w-24 h-24 rounded-full bg-muted animate-pulse mx-auto" />
              ) : avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full mx-auto object-cover"
                />
              ) : user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full mx-auto object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="sr-only"
                  disabled={isUploading}
                />
              </label>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.proTier && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Pro Member
                </span>
              )}
            </div>
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'password', label: 'Password', icon: AlertCircle },
                { id: 'account', label: 'Account', icon: AlertCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  aria-label={`Switch to ${tab.label} settings`}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-background border border-border rounded-lg p-6">
            {activeTab === 'profile' && (
              <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <Input
                      {...profileForm.register('name')}
                      placeholder="Your name"
                      aria-label="Full Name"
                      disabled={updateProfileMutation.isPending}
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      {...profileForm.register('email')}
                      type="email"
                      placeholder="your@email.com"
                      aria-label="Email"
                      disabled={updateProfileMutation.isPending}
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    {...profileForm.register('bio')}
                    rows={4}
                    aria-label="Biography"
                    className="w-full p-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tell us about yourself..."
                    disabled={updateProfileMutation.isPending}
                  />
                  {profileForm.formState.errors.bio && (
                    <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.bio.message}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))} className="space-y-6 max-w-md">
                <h2 className="text-xl font-semibold">Change Password</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Current Password</label>
                  <Input
                    {...passwordForm.register('currentPassword')}
                    type="password"
                    placeholder="••••••••"
                    aria-label="Current Password"
                    disabled={updatePasswordMutation.isPending}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <Input
                    {...passwordForm.register('newPassword')}
                    type="password"
                    placeholder="••••••••"
                    aria-label="New Password"
                    disabled={updatePasswordMutation.isPending}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <Input
                    {...passwordForm.register('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    aria-label="Confirm New Password"
                    disabled={updatePasswordMutation.isPending}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updatePasswordMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'account' && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Account Type</h2>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{user?.proTier ? 'Pro Plan' : 'Free Plan'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user?.proTier
                            ? 'Unlimited boards, members, and real-time features'
                            : '10 boards max, 3 members per board'}
                        </p>
                      </div>
                      {!user?.proTier && (
                        <Button asChild>
                          <a href="/pricing">Upgrade to Pro</a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-8">
                  <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Delete Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}