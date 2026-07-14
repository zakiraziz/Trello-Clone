export const Settings = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="mt-2 text-sm text-slate-600">Configure your workspace, account, billing, and privacy preferences.</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">General</h2>
              <ul className="mt-4 space-y-3 text-slate-700">
                <li>Workspace name</li>
                <li>Workspace logo</li>
                <li>Default board visibility</li>
              </ul>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Account</h2>
              <ul className="mt-4 space-y-3 text-slate-700">
                <li>Change email</li>
                <li>Update password</li>
                <li className="text-red-600">Delete account (danger zone)</li>
              </ul>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Billing</h2>
              <ul className="mt-4 space-y-3 text-slate-700">
                <li>Current plan</li>
                <li>Payment history</li>
                <li>Update payment method</li>
                <li>Cancel subscription</li>
              </ul>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Notifications & Privacy</h2>
              <ul className="mt-4 space-y-3 text-slate-700">
                <li>Email notifications toggle</li>
                <li>In-app notifications toggle</li>
                <li>Data export</li>
                <li>Delete all data</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
