import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useBoards } from '../hooks/useBoards'
import { useCreateBoard } from '../hooks/useCreateBoard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, LogOut, Settings, User, Folder } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface BoardItem {
  id: string
  name: string
  description?: string
  owner_id: string
  background_color?: string
  is_archived: boolean
  is_starred?: boolean
  created_at: string
  updated_at: string
  member_count: number
  list_count: number
}

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  
  const { data: boards = [], isLoading, error } = useBoards()
  const createBoard = useCreateBoard()

  const filteredBoards = boards.filter(board => 
    !board.is_archived && 
    (board.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     board.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return
    
    try {
      await createBoard.mutateAsync({ name: newBoardName.trim() })
      setIsCreateBoardOpen(false)
      setNewBoardName('')
      toast.success('Board created!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create board')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load boards</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Boards</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>
            
            <Link to="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateBoardOpen(true)}
              className="bg-[#026AA7] hover:bg-[#025a8c] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </div>
        </div>

        {filteredBoards.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No boards match your search.' : 'Create your first board to get started!'}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsCreateBoardOpen(true)}
                className="bg-[#026AA7] hover:bg-[#025a8c] text-white"
              >
                Create First Board
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoards.map((board) => (
              <Card key={board.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/board/${board.id}`)}>
                <CardHeader className="pb-2">
                  <CardTitle className="truncate">{board.name}</CardTitle>
                  {board.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {board.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground gap-4">
                    <span>{(board as BoardItem).list_count || 0} lists</span>
                    <span>{(board as BoardItem).member_count || 1} member{(board as BoardItem).member_count !== 1 ? 's' : ''}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
        <DialogContent>
          <form onSubmit={handleCreateBoard}>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Board name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                autoFocus
              />
              <Button 
                type="submit" 
                className="w-full bg-[#026AA7] hover:bg-[#025a8c] text-white"
                disabled={createBoard.isPending}
              >
                {createBoard.isPending ? 'Creating...' : 'Create Board'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { DashboardPage as Dashboard }
export default DashboardPage