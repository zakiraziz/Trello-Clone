export const ActivityLog = () => {
  const activities = [
    { label: 'User joined the board', time: 'Just now' },
    { label: 'Card created', time: '10 minutes ago' },
    { label: 'List added', time: '1 hour ago' },
    { label: 'Card moved', time: '2 hours ago' },
    { label: 'Comment added', time: 'Yesterday' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Activity Log</h1>
          <p className="mt-2 text-sm text-slate-600">Review all board actions and activity in one timeline.</p>
          <div className="mt-8 space-y-4">
            {activities.map((activity) => (
              <div key={activity.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-slate-900">{activity.label}</p>
                  <span className="text-sm text-slate-500">{activity.time}</span>
                </div>
                <p className="mt-2 text-slate-600">Details for {activity.label.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
