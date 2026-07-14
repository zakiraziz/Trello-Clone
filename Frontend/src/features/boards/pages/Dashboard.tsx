import { BoardGrid } from '../components/BoardGrid'

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Workspace</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your boards</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Keep projects moving with a calm, organized view of everything you are working on.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Built for focused work
            </div>
          </div>
        </div>
        <BoardGrid />
      </div>
    </div>
  )
}
