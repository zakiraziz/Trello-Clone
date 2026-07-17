import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Layout,
  LogOut,
  Settings,
  Search,
  Plus,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

export const Navbar = () => {
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isLoading) {
    return (
      <nav className="h-16 bg-[#026AA7] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="w-32 h-6 bg-white/20 rounded animate-pulse" />
        </div>
      </nav>
    )
  }

  return (
    <nav className="h-16 bg-[#026AA7] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <Layout className="w-6 h-6" />
          <span>TrelloClone</span>
        </Link>

        {/* Search Bar - Only when logged in */}
        {user && (
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Search boards..."
                className="w-full bg-white/20 border border-white/20 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/30 focus:border-white/40 transition-colors"
                onClick={() => navigate('/search')}
              />
            </div>
          </div>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </Button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </button>

                <button
                  onClick={() => navigate('/settings')}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <button
                  onClick={logout}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white/90 hover:text-white text-sm font-medium px-3 py-2"
              >
                Log In
              </Link>
              <Button
                onClick={() => navigate('/register')}
                className="bg-white text-[#026AA7] hover:bg-white/90 font-medium"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#026AA7] border-t border-white/10 px-4 py-4 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-medium text-white">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-white/60 text-sm">{user.email}</p>
                </div>
              </div>
              <Link to="/dashboard" className="block text-white py-2">Dashboard</Link>
              <Link to="/profile" className="block text-white py-2">Profile</Link>
              <Link to="/settings" className="block text-white py-2">Settings</Link>
              <button onClick={logout} className="block text-white py-2 w-full text-left">
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-white py-2">Log In</Link>
              <Link to="/register" className="block text-white py-2">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}