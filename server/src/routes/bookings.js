import { Router } from "express";
import { db } from "../db.js";

const router = Router();

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

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
  const { vehicleId, startDate, endDate, renterName } = req.body;

  if (!vehicleId || !startDate || !endDate || !renterName) {
    return res.status(400).json({
      error: "vehicleId, startDate, endDate, and renterName are required",
    });
  }
  if (startDate >= endDate) {
    return res.status(400).json({ error: "startDate must be before endDate" });
  }
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
  const result = insert.run(vehicleId, startDate, endDate, renterName);
  const booking = db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(booking);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, renterName } = req.body;

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.source !== "direct") {
    return res.status(400).json({
      error: "Only direct bookings can be edited here — manage Turo bookings in Turo",
    });
  }
  if (!startDate || !endDate || !renterName) {
    return res.status(400).json({ error: "startDate, endDate, and renterName are required" });
  }
  if (startDate >= endDate) {
    return res.status(400).json({ error: "startDate must be before endDate" });
  }
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
  ).run(startDate, endDate, renterName, id);

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
  res.status(204).end();
});

export default router;
export { findOverlap };
