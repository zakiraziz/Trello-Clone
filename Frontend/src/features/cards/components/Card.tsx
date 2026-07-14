import { Card as CardType } from '../types'
import { format } from 'date-fns'

interface CardProps {
  card: CardType
}

export const Card = ({ card }: CardProps) => {
  return (
    <div className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-800">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {card.description}
        </p>
      )}
      {card.due_date && (
        <p className="mt-2 text-xs font-medium text-amber-600">
          Due: {format(new Date(card.due_date), 'MMM d, yyyy')}
        </p>
      )}
    </div>
  )
}
