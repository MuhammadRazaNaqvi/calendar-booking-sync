import ical from "ical-generator";
import nodeIcal from "node-ical";
import { db } from "./db.js";
import { recalculateVehicleConflictStatuses } from "./conflicts.js";

function dateOnly(date) {
  if (!date.dateOnly) return date.toISOString().slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function mockTuroCalendar(vehicleId) {
  const calendar = ical({ name: "Mock Turo reservations" });
  const events = db.prepare("SELECT * FROM mock_turo_events WHERE vehicle_id = ? ORDER BY start_date").all(vehicleId);
  for (const event of events) {
    calendar.createEvent({
      id: event.uid,
      start: new Date(`${event.start_date}T00:00:00Z`),
      end: new Date(`${event.end_date}T00:00:00Z`),
      allDay: true,
      summary: event.renter_name,
    });
  }
  return calendar.toString();
}

export const syncTuroBookings = db.transaction((vehicleId) => {
  const events = Object.values(nodeIcal.sync.parseICS(mockTuroCalendar(vehicleId))).filter(event => event.type === "VEVENT");
  const find = db.prepare("SELECT id FROM bookings WHERE vehicle_id = ? AND source = 'turo' AND external_uid = ?");
  const insert = db.prepare("INSERT INTO bookings (vehicle_id, source, start_date, end_date, renter_name, external_uid) VALUES (?, 'turo', ?, ?, ?, ?)");
  const importedIds = [];
  let skipped = 0;
  for (const event of events) {
    if (find.get(vehicleId, event.uid)) {
      skipped += 1;
      continue;
    }
    const result = insert.run(vehicleId, dateOnly(event.start), dateOnly(event.end), event.summary, event.uid);
    importedIds.push(result.lastInsertRowid);
  }
  recalculateVehicleConflictStatuses(vehicleId);
  const bookings = db.prepare("SELECT * FROM bookings WHERE vehicle_id = ? ORDER BY start_date").all(vehicleId);
  const directBookings = bookings.filter(booking => booking.source === "direct");
  const conflicts = [];
  for (const turo of bookings.filter(booking => booking.source === "turo")) {
    for (const direct of directBookings) {
      if (turo.start_date < direct.end_date && direct.start_date < turo.end_date) {
        conflicts.push({ turoBookingId: turo.id, conflictingBooking: direct });
      }
    }
  }
  return { imported: bookings.filter(booking => importedIds.includes(booking.id)), skipped, conflicts };
});