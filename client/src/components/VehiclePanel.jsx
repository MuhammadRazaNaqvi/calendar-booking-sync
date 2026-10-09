export default function VehiclePanel({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  vehicle,
  onSync,
  syncing,
  stats,
  bookingForm,
  onBookingFieldChange,
  onBookingSubmit,
  bookingSubmitting,
  formMessage,
}) {
  if (!vehicle) {
    return (
      <aside>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-sm text-slate-500">
          Loading vehicle...
        </div>
      </aside>
    );
  }

  return (
    <aside className="lg:sticky lg:top-20">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
        <div className="relative h-40 bg-gradient-to-br from-slate-100 to-orange-100">
          <img
            src={vehicle.photo_url}
            alt={vehicle.make_model}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling.style.display = "flex";
            }}
          />
          <div className="hidden absolute inset-0 items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-24 h-24 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 38l4-12a4 4 0 014-3h16a4 4 0 014 3l4 12" />
              <rect x="6" y="38" width="52" height="10" rx="3" />
              <circle cx="18" cy="50" r="4" />
              <circle cx="46" cy="50" r="4" />
            </svg>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <p className="font-display text-sm font-semibold">{vehicle.make_model}</p>
          <p className="text-xs text-slate-500 mb-3">
            {vehicle.name} · Plate {vehicle.plate}
          </p>

          <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs border-t border-b border-slate-100 py-3 mb-3">
            <div>
              <p className="text-slate-400">Color</p>
              <p className="font-medium text-slate-700">{vehicle.color}</p>
            </div>
            <div>
              <p className="text-slate-400">Seats</p>
              <p className="font-medium text-slate-700">{vehicle.seats}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400">Type</p>
              <p className="font-medium text-slate-700">{vehicle.vehicle_type}</p>
            </div>
          </div>

          <select
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2"
            value={selectedVehicleId}
            onChange={(e) => onSelectVehicle(Number(e.target.value))}
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make_model}
              </option>
            ))}
          </select>

          <button
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm mb-3"
            onClick={onSync}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync Turo now"}
          </button>

          <form onSubmit={onBookingSubmit} className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New direct booking</p>
            <div className="flex gap-2">
              <input
                type="date"
                required
                className="w-1/2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                value={bookingForm.startDate}
                onChange={(e) => onBookingFieldChange("startDate", e.target.value)}
              />
              <input
                type="date"
                required
                className="w-1/2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                value={bookingForm.endDate}
                onChange={(e) => onBookingFieldChange("endDate", e.target.value)}
              />
            </div>
            <input
              type="text"
              required
              placeholder="Renter name"
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              value={bookingForm.renterName}
              onChange={(e) => onBookingFieldChange("renterName", e.target.value)}
            />
            <button
              type="submit"
              disabled={bookingSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg shadow-sm"
            >
              {bookingSubmitting ? "Checking..." : "Create booking"}
            </button>
            {formMessage && (
              <p className={`text-xs ${formMessage.type === "conflict" ? "text-red-600" : "text-emerald-600"}`}>
                {formMessage.text}
              </p>
            )}
          </form>

          <div className="mt-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>{stats.thisMonth} bookings this month</span>
            {stats.conflicts > 0 ? (
              <span className="text-red-500 font-medium">{stats.conflicts} conflict{stats.conflicts > 1 ? "s" : ""}</span>
            ) : (
              <span className="text-slate-400">No conflicts</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
