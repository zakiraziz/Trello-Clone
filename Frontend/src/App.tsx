import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './providers/AuthProvider'
import { useAuth } from './features/auth/hooks/useAuth'
import { Loader } from './components/ui/loader'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Navbar } from './components/Navbar'

const Login = React.lazy(() => import('./features/auth/pages/Login').then(m => ({ default: m.Login })))
const Register = React.lazy(() => import('./features/auth/pages/Register').then(m => ({ default: m.Register })))
const Landing = React.lazy(() => import('./features/landing/Landing').then(m => ({ default: m.Landing })))
const Pricing = React.lazy(() => import('./features/pricing/Pricing').then(m => ({ default: m.Pricing })))
const Profile = React.lazy(() => import('./features/profile/Profile').then(m => ({ default: m.Profile })))
const Settings = React.lazy(() => import('./features/settings/Settings').then(m => ({ default: m.Settings })))
const SearchPage = React.lazy(() => import('./features/pages/SearchPage').then(m => ({ default: m.SearchPage })))
const ActivityLog = React.lazy(() => import('./features/activity/ActivityLog').then(m => ({ default: m.ActivityLog })))
const Dashboard = React.lazy(() => import('./features/boards/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const BoardPage = React.lazy(() => import('./features/boards/pages/BoardPage').then(m => ({ default: m.BoardPage })))
const InfoPage = React.lazy(() => import('./features/pages/InfoPage').then(m => ({ default: m.InfoPage })))

const queryClient = new QueryClient()

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Loader />
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Loader />
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Navbar />
            <Suspense fallback={<Loader containerClassName="flex items-center justify-center min-h-screen" />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />
                <Route path="/features" element={<InfoPage title="Features" description="See how TrelloClone helps teams plan, prioritize, and deliver work without the usual clutter." ctaLabel="Start free" ctaTo="/register" secondaryLabel="View pricing" secondaryTo="/pricing" />} />
                <Route path="/about" element={<InfoPage title="About TrelloClone" description="We build practical workflow tools that make planning, collaboration, and execution feel calm and focused." ctaLabel="Try the product" ctaTo="/register" />} />
                <Route path="/blog" element={<InfoPage title="Blog" description="Insights, tips, and product updates for modern teams managing work at every stage." ctaLabel="Read latest updates" ctaTo="/pricing" />} />
                <Route path="/careers" element={<InfoPage title="Careers" description="Join our team and help shape the next generation of collaborative work tools." ctaLabel="See open roles" ctaTo="/contact" />} />
                <Route path="/contact" element={<InfoPage title="Contact us" description="Questions, demos, or onboarding help? We are here to make your setup smooth and stress-free." ctaLabel="Start a conversation" ctaTo="/register" />} />
                <Route path="/privacy" element={<InfoPage title="Privacy policy" description="We treat your data carefully and keep your projects secure with modern safeguards and transparent controls." ctaLabel="Back to home" ctaTo="/" />} />
                <Route path="/terms" element={<InfoPage title="Terms of service" description="These terms outline the responsibilities and expectations for using TrelloClone responsibly." ctaLabel="Create account" ctaTo="/register" />} />
                <Route path="/security" element={<InfoPage title="Security" description="Built with secure authentication, clear permissions, and reliable data handling practices." ctaLabel="See plans" ctaTo="/pricing" />} />
                <Route path="/cookies" element={<InfoPage title="Cookie policy" description="We use cookies to keep the product working smoothly and improve your experience over time." ctaLabel="Back to home" ctaTo="/" />} />
                <Route path="/changelog" element={<InfoPage title="Changelog" description="Stay up to date with the latest features, improvements, and fixes shipped to TrelloClone." ctaLabel="Try latest features" ctaTo="/register" />} />
                <Route path="/roadmap" element={<InfoPage title="Roadmap" description="Our roadmap focuses on faster collaboration, smarter automation, and a better planning experience." ctaLabel="Join the waitlist" ctaTo="/register" />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/board/:id"
                  element={
                    <ProtectedRoute>
                      <BoardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/board/:id/activity"
                  element={
                    <ProtectedRoute>
                      <ActivityLog />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
            <Toaster richColors position="top-right" />
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App