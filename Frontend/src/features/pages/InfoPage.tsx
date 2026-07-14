import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InfoPageProps {
  eyebrow?: string
  title: string
  description: string
  ctaLabel?: string
  ctaTo?: string
  secondaryLabel?: string
  secondaryTo?: string
  children?: ReactNode
}

export const InfoPage = ({
  eyebrow = 'Product update',
  title,
  description,
  ctaLabel = 'Get started',
  ctaTo = '/register',
  secondaryLabel,
  secondaryTo,
  children,
}: InfoPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            TrelloClone
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/login" className="hover:text-foreground">Login</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex max-w-5xl items-center px-6 py-24">
        <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-12">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {ctaTo && (
              <Link to={ctaTo}>
                <Button className="gap-2">
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {secondaryTo && secondaryLabel && (
              <Link to={secondaryTo}>
                <Button variant="outline">{secondaryLabel}</Button>
              </Link>
            )}
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
