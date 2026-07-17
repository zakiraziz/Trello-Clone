import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Link, Copy, X, Crown, Settings, Eye, Pencil } from 'lucide-react'

interface ShareModalProps {
  boardId: string
  boardName: string
  isOpen: boolean
  onClose: () => void
}

interface Member {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  avatar?: string
}

export const ShareModal = ({ boardId, boardName, isOpen, onClose }: ShareModalProps) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'You', email: 'you@example.com', role: 'owner' },
  ])
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [isLoading, setIsLoading] = useState(false)

  const handleInvite = async () => {
    if (!email.trim()) return
    setIsLoading(true)
    try {
      await api.post(`/boards/${boardId}/invite`, { email, role })
      toast.success(`Invited ${email} as ${role}`)
      setMembers([...members, { id: Date.now().toString(), name: email.split('@')[0], email, role }])
      setEmail('')
    } catch (err) {
      toast.error('Failed to send invite')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/board/${boardId}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied to clipboard!')
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter(m => m.id !== memberId))
    toast.success('Member removed')
  }

  const roleIcons = {
    owner: <Crown className="w-4 h-4 text-yellow-500" />,
    admin: <Settings className="w-4 h-4 text-blue-500" />,
    editor: <Pencil className="w-4 h-4 text-green-500" />,
    viewer: <Eye className="w-4 h-4 text-gray-500" />,
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Share "{boardName}"
          </DialogTitle>
        </DialogHeader>

        {/* Invite Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              className="flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="border rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button onClick={handleInvite} disabled={isLoading}>
              Invite
            </Button>
          </div>

          {/* Board Link */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <label className="text-xs font-medium text-gray-500 uppercase">Board Link</label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={`${window.location.origin}/board/${boardId}`}
                className="text-sm bg-white"
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div>
              <div className="font-medium text-sm">Board Visibility</div>
              <div className="text-xs text-gray-500">
                {visibility === 'private' ? 'Only invited members can access' : 'Anyone with the link can view'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVisibility('private')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  visibility === 'private' ? 'bg-[#026AA7] text-white' : 'bg-white border'
                }`}
              >
                Private
              </button>
              <button
                onClick={() => setVisibility('public')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  visibility === 'public' ? 'bg-[#026AA7] text-white' : 'bg-white border'
                }`}
              >
                Public
              </button>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h4 className="text-sm font-medium mb-3">Board Members</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#61BD4F] to-[#00A3BF] flex items-center justify-center text-white text-sm font-bold">
                      {member.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-gray-600 capitalize">
                      {roleIcons[member.role]}
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}