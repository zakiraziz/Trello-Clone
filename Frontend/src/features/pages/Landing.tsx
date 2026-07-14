import { Link } from 'react-router-dom'

export const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Trello Clone SaaS</p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Build boards, lists, and cards with real-time collaboration.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Launch your productivity workspace with a modern board experience, team sharing, activity logs, and pricing plans built for teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Start Free Trial
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-slate-500 px-6 py-3 text-sm text-slate-200 transition hover:border-slate-300"
              >
                View Pricing
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-slate-900/80 p-8 ring-1 ring-slate-700/70 sm:p-10">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Trusted by modern teams</p>
            <div className="mt-6 grid gap-4 text-slate-300 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-800/80 p-6">
                <p className="text-xl font-semibold text-white">Boards</p>
                <p className="mt-2 text-sm text-slate-400">Organize your work with board-based workflows.</p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 p-6">
                <p className="text-xl font-semibold text-white">Lists</p>
                <p className="mt-2 text-sm text-slate-400">Group related tasks in columns for easy planning.</p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 p-6">
                <p className="text-xl font-semibold text-white">Cards</p>
                <p className="mt-2 text-sm text-slate-400">Track cards with rich details, tags, and due dates.</p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 p-6">
                <p className="text-xl font-semibold text-white">Live updates</p>
                <p className="mt-2 text-sm text-slate-400">See changes instantly with websocket-powered sync.</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-16 rounded-3xl bg-slate-900/80 p-8 ring-1 ring-slate-700/70">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Features overview</h2>
              <p className="text-slate-400">Everything you need to manage boards, lists, cards, and team activity.</p>
            </div>
            <div className="space-y-4 rounded-3xl bg-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white">Boards</h3>
              <p className="text-slate-400">Create and organize boards with categories, members, and backgrounds.</p>
            </div>
            <div className="space-y-4 rounded-3xl bg-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white">Real-time</h3>
              <p className="text-slate-400">Collaborate instantly when cards move, comments appear, or lists update.</p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl bg-slate-900/80 p-8 ring-1 ring-slate-700/70">
            <h2 className="text-2xl font-bold text-white">Pricing plans</h2>
            <p className="mt-3 text-slate-400">Choose the right plan for individuals or teams.</p>
            <div className="mt-8 space-y-4">
              <div className="rounded-3xl bg-slate-800 p-6">
                <h3 className="text-xl font-semibold text-white">Free</h3>
                <p className="mt-2 text-slate-400">10 boards max, 3 members per board, basic task management.</p>
              </div>
              <div className="rounded-3xl bg-cyan-500 p-6 text-slate-950">
                <h3 className="text-xl font-semibold">Pro</h3>
                <p className="mt-2">Unlimited boards, unlimited members, real-time updates, priority support.</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-8 ring-1 ring-slate-700/70">
            <h2 className="text-2xl font-bold text-white">Testimonials</h2>
            <div className="mt-8 space-y-6 text-slate-300">
              <blockquote className="rounded-3xl bg-slate-800 p-6">
                “The board experience is clean and fast — our team stayed aligned from day one.”
              </blockquote>
              <blockquote className="rounded-3xl bg-slate-800 p-6">
                “Real-time updates made remote collaboration feel seamless.”
              </blockquote>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-8 ring-1 ring-slate-700/70">
            <h2 className="text-2xl font-bold text-white">Get started</h2>
            <div className="mt-8 space-y-4 text-slate-300">
              <p>Login or signup to begin using your workspace today.</p>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-600 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-20 border-t border-slate-800 pt-10 text-slate-400">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm">Trello Clone SaaS — Build boards faster.</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/pricing" className="hover:text-white">Pricing</Link>
              <Link to="/login" className="hover:text-white">Login</Link>
              <Link to="/register" className="hover:text-white">Signup</Link>
              <Link to="/profile" className="hover:text-white">Profile</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
