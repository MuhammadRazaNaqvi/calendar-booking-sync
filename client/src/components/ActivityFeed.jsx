import { CarIcon, WarningIcon, CheckCircleIcon } from "./icons.jsx";

const STYLES = {
  sync: { border: "border-orange-400", icon: CarIcon, iconColor: "text-orange-500" },
  conflict: { border: "border-red-500", icon: WarningIcon, iconColor: "text-red-500" },
  success: { border: "border-blue-500", icon: CheckCircleIcon, iconColor: "text-blue-500" },
};

export default function ActivityFeed({ items }) {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-8">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <p className="font-display text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Activity</p>
        {items.length === 0 ? (
          <p className="text-xs text-slate-400">
            Nothing yet — click &quot;Sync Turo now&quot; or create a direct booking to see activity here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {items.map((item) => {
              const style = STYLES[item.type];
              const Icon = style.icon;
              return (
                <div key={item.id} className={`flex items-start gap-2.5 bg-slate-50 border-l-4 ${style.border} rounded-lg p-3`}>
                  <Icon className={`w-4 h-4 ${style.iconColor} mt-0.5 flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
