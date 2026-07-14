import { LayoutGrid, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBoards } from '../hooks/useBoards'
import { BoardCard } from './BoardCard'
import { BoardSkeleton } from './BoardSkeleton'
import { CreateBoardDialog } from './CreateBoardDialog'

export const BoardGrid = () => {
  const { data: boards, isLoading, error, refetch } = useBoards()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <BoardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <RefreshCw className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-red-700">We could not load your boards</h3>
        <p className="mt-2 text-sm text-red-600">
          Please check your connection and try again in a moment.
        </p>
        <Button className="mt-4" onClick={() => void refetch()}>
          Retry loading
        </Button>
      </div>
    )
  }

  if (!boards || boards.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <LayoutGrid className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-900">No boards yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Create your first board to organize work, share ideas, and keep momentum going.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <CreateBoardDialog />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
      <CreateBoardDialog />
    </div>
  )
}
