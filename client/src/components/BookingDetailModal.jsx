import { useState } from "react";
import { XIcon, TrashIcon } from "./icons.jsx";
import { todayStr } from "../dateUtils.js";

export default function BookingDetailModal({ booking, onClose, onUpdate, onDelete, saving, error }) {
  const isDirect = booking.source === "direct";
  const [form, setForm] = useState({
    startDate: booking.start_date,
    endDate: booking.end_date,
    renterName: booking.renter_name,
  });
  // Already-started bookings keep their original start date as the floor, instead of forcing it forward to today.
  const minStartDate = booking.start_date < todayStr() ? booking.start_date : todayStr();

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    onUpdate(booking.id, form);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-sm font-bold">{isDirect ? "Direct booking" : "Turo booking"}</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {!isDirect && (
          <p className="text-xs text-slate-500">
            Synced from Turo — manage dates in Turo, not here. {booking.start_date} to {booking.end_date},{" "}
            {booking.renter_name}.
          </p>
        )}

        {isDirect && (
          <form onSubmit={handleSave} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="date"
                required
                min={minStartDate}
                className="w-1/2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
              <input
                type="date"
                required
                min={form.startDate || todayStr()}
                className="w-1/2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
            <input
              type="text"
              required
              placeholder="Renter name"
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              value={form.renterName}
              onChange={(e) => handleChange("renterName", e.target.value)}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg shadow-sm"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => onDelete(booking.id)}
                className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
