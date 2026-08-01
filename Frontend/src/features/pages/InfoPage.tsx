import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

interface InfoPageProps {
  title: string
  description: string
  ctaLabel: string
  ctaTo: string
  secondaryLabel?: string
  secondaryTo?: string
}

export const InfoPage = ({ title, description, ctaLabel, ctaTo, secondaryLabel, secondaryTo }: InfoPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <main id="main-content" className="container mx-auto px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>TrelloClone</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={ctaTo}>
              <Button size="lg" className="gap-2">
                {ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {secondaryLabel && secondaryTo && (
              <Link to={secondaryTo}>
                <Button size="lg" variant="outline">
                  {secondaryLabel}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}