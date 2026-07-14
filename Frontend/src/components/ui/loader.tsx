// src/components/ui/loader.tsx
import { Loader2 } from 'lucide-react'

export const Loader = ({ className = 'h-8 w-8', containerClassName = 'flex items-center justify-center min-h-[200px]' }: { className?: string; containerClassName?: string }) => {
  return (
    <div className={containerClassName}>
      <Loader2 className={`animate-spin text-primary ${className}`} />
    </div>
  )
}
