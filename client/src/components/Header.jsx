import { formatDistanceToNowStrict } from "date-fns";
import { HomeIcon, CarIcon, ChartIcon, BellIcon, CheckCircleIcon, WarningIcon } from "./icons.jsx";

export default function Header({ lastSyncedAt, notifications }) {
  const unread = notifications.length;

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-display text-base font-bold tracking-tight">Calendar Booking Sync</span>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-slate-500">
            <a className="flex items-center gap-1.5 text-slate-900 font-medium" href="#">
              <HomeIcon className="w-4 h-4" />
              Dashboard
            </a>
            <a className="flex items-center gap-1.5 hover:text-slate-800" href="#vehicles">
              <CarIcon className="w-4 h-4" />
              Vehicles
            </a>
            <a className="flex items-center gap-1.5 hover:text-slate-800" href="#activity">
              <ChartIcon className="w-4 h-4" />
              Activity
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${
              lastSyncedAt
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {lastSyncedAt && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${lastSyncedAt ? "bg-emerald-500" : "bg-slate-400"}`} />
            </span>
            {lastSyncedAt ? `Synced ${formatDistanceToNowStrict(lastSyncedAt)} ago` : "Not synced this session"}
          </div>

          <details className="relative">
            <summary className="list-none cursor-pointer w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 relative">
              <BellIcon className="w-4 h-4 text-slate-500" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </summary>
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-1">
              <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Notifications</p>
              {notifications.length === 0 && (
                <p className="px-2 py-2 text-xs text-slate-400">Nothing yet — sync Turo or create a booking.</p>
              )}
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-slate-50">
                  {n.type === "conflict" ? (
                    <WarningIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
