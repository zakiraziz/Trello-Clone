export const Pricing = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Pricing</h1>
          <p className="mt-2 text-sm text-slate-600">Compare plans and choose the right option for your team.</p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <h2 className="text-2xl font-semibold text-slate-900">Free Plan</h2>
              <p className="mt-3 text-slate-600">Great for individuals who want to try the core experience.</p>
              <ul className="mt-6 space-y-3 text-slate-700">
                <li>10 boards max</li>
                <li>3 members per board</li>
                <li>Basic features</li>
                <li>No real-time updates</li>
              </ul>
              <button className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                Choose Free
              </button>
            </div>
            <div className="rounded-3xl border border-cyan-500 bg-cyan-500 p-8 text-slate-950">
              <h2 className="text-2xl font-semibold">Pro Plan</h2>
              <p className="mt-3 text-slate-900">Perfect for teams that need unlimited boards, unlimited members, and premium support.</p>
              <ul className="mt-6 space-y-3 text-slate-950">
                <li>Unlimited boards</li>
                <li>Unlimited members</li>
                <li>Real-time updates</li>
                <li>Priority support</li>
                <li>Advanced collaboration tools</li>
              </ul>
              <button className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Subscribe with Stripe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
