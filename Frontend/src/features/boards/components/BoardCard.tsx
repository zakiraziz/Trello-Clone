import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Board } from '../types'
import { useStarBoard } from '@/hooks/useStarBoard'

interface BoardCardProps {
  board: Board
}

export const BoardCard = ({ board }: BoardCardProps) => {
  const starMutation = useStarBoard()

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    starMutation.mutate({ boardId: board.id, isStarred: !board.is_starred })
  }

  return (
    <Link
      to={`/board/${board.id}`}
      className="board-card group relative block overflow-hidden rounded-2xl border border-white/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        backgroundColor: board.background_color || '#f4f5f7',
        backgroundImage: board.background_color
          ? `linear-gradient(135deg, ${board.background_color} 0%, rgba(255,255,255,0.9) 100%)`
          : undefined,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-lg font-semibold text-slate-900">{board.name}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStarClick}
              className="rounded-full bg-white/70 p-1.5 transition-colors hover:bg-white"
              aria-label={board.is_starred ? 'Unstar board' : 'Star board'}
            >
              <Star
                className={`h-4 w-4 ${board.is_starred ? 'fill-yellow-500 text-yellow-500' : 'text-slate-700'}`}
              />
            </button>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-700">
              Open
            </span>
          </div>
        </div>
        {board.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-700">
            {board.description}
          </p>
        )}
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <span>Created {new Date(board.created_at).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
            Open board <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
