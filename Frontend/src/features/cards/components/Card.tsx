import { useState } from 'react'
import { Card as CardType } from '../types'
import { format } from 'date-fns'
import { CardModal } from './CardModal'

interface CardProps {
  card: CardType
}

export const Card = ({ card }: CardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
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

      <CardModal 
        card={card} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onUpdate={(updatedCard) => {
          // Handle card update - you may want to pass this as a prop
          console.log('Card updated:', updatedCard)
        }}
      />
    </>
  )
}
