import { List as ListType } from '../types'
import { Card as CardType } from '@/features/boards/types'
import { Card } from '@/features/cards/components/Card'
import { AddCard } from '@/features/cards/components/AddCard'

interface ListProps {
  list: ListType & { cards?: CardType[] }
}

export const List = ({ list }: ListProps) => {
  return (
    <div className="w-80 shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="truncate font-semibold text-slate-900">{list.title}</h3>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
          {list.cards?.length || 0}
        </span>
      </div>

      <div className="space-y-2">
        {list.cards?.length ? (
          list.cards.map((card) => <Card key={card.id} card={card} />)
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-sm text-slate-500">
            This list is empty. Add a card to get started.
          </div>
        )}
      </div>

      <AddCard listId={list.id} />
    </div>
  )
}
