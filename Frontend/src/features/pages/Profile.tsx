export const Profile = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
              <p className="mt-2 text-sm text-slate-600">Manage your account, bio, and connected services.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Personal details</h2>
              <div className="space-y-3 text-slate-700">
                <p><span className="font-semibold">Full name:</span> Jane Doe</p>
                <p><span className="font-semibold">Email:</span> jane@example.com</p>
                <p><span className="font-semibold">Account type:</span> Free</p>
                <p><span className="font-semibold">Bio:</span> Product lead who loves clean workflows.</p>
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Security</h2>
              <div className="space-y-3 text-slate-700">
                <p>Change password, enable two-factor authentication, and connect accounts.</p>
                <button className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
