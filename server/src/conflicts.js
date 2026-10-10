import { db } from "./db.js";

function overlaps(a, b) {
  return a.start_date < b.end_date && b.start_date < a.end_date;
}

export function recalculateVehicleConflictStatuses(vehicleId) {
  const bookings = db
    .prepare("SELECT id, start_date, end_date FROM bookings WHERE vehicle_id = ? ORDER BY start_date")
    .all(vehicleId);

  const conflictedIds = new Set();

  for (let i = 0; i < bookings.length; i += 1) {
    for (let j = i + 1; j < bookings.length; j += 1) {
      if (overlaps(bookings[i], bookings[j])) {
        conflictedIds.add(bookings[i].id);
        conflictedIds.add(bookings[j].id);
      }
    }
  }

  const markConfirmed = db.prepare("UPDATE bookings SET status = 'confirmed' WHERE vehicle_id = ?");
  const markConflict = db.prepare("UPDATE bookings SET status = 'flagged_conflict' WHERE id = ?");

  const tx = db.transaction(() => {
    markConfirmed.run(vehicleId);
    for (const id of conflictedIds) {
      markConflict.run(id);
    }
  });

  tx();
}
