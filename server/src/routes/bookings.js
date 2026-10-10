import { Router } from "express";
import { db } from "../db.js";
import { recalculateVehicleConflictStatuses } from "../conflicts.js";
import { todayStr, validateReservation } from "../validation.js";

const router = Router();

function findOverlap(vehicleId, startDate, endDate, excludeBookingId = null) {
  const existing = db
    .prepare(
      "SELECT * FROM bookings WHERE vehicle_id = ? AND id != ?"
    )
    .all(vehicleId, excludeBookingId ?? -1);

  return existing.find(
    (booking) => startDate < booking.end_date && booking.start_date < endDate
  );
}

router.post("/", (req, res) => {
  const { vehicleId, startDate, endDate, renterName } = req.body ?? {};

  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) return res.status(400).json({ error: "A valid vehicleId is required" });
  const error = validateReservation({ startDate, endDate, renterName });
  if (error) return res.status(400).json({ error });
  if (startDate < todayStr()) {
    return res.status(400).json({ error: "startDate cannot be in the past" });
  }

  const vehicle = db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const conflict = findOverlap(vehicleId, startDate, endDate);
  if (conflict) {
    return res.status(409).json({
      error: "This vehicle is already booked for an overlapping date range",
      conflictingBooking: conflict,
    });
  }

  const insert = db.prepare(`
    INSERT INTO bookings (vehicle_id, source, start_date, end_date, renter_name, status)
    VALUES (?, 'direct', ?, ?, ?, 'confirmed')
  `);
  const result = insert.run(vehicleId, startDate, endDate, renterName.trim());
  recalculateVehicleConflictStatuses(vehicleId);
  const booking = db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(booking);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, renterName } = req.body ?? {};

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.source !== "direct") {
    return res.status(400).json({
      error: "Only direct bookings can be edited here — manage Turo bookings in Turo",
    });
  }
  const error = validateReservation({ startDate, endDate, renterName });
  if (error) return res.status(400).json({ error });
  // Allow keeping an already-started booking's original start date, just block moving it further into the past.
  if (startDate !== booking.start_date && startDate < todayStr()) {
    return res.status(400).json({ error: "startDate cannot be in the past" });
  }

  const conflict = findOverlap(booking.vehicle_id, startDate, endDate, booking.id);
  if (conflict) {
    return res.status(409).json({
      error: "This vehicle is already booked for an overlapping date range",
      conflictingBooking: conflict,
    });
  }

  db.prepare(
    "UPDATE bookings SET start_date = ?, end_date = ?, renter_name = ?, status = 'confirmed' WHERE id = ?"
  ).run(startDate, endDate, renterName.trim(), id);

  recalculateVehicleConflictStatuses(booking.vehicle_id);

  const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.source !== "direct") {
    return res.status(400).json({
      error: "Only direct bookings can be deleted here — manage Turo bookings in Turo",
    });
  }

  db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
  recalculateVehicleConflictStatuses(booking.vehicle_id);
  res.status(204).end();
});

export default router;
