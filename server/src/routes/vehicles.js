import { Router } from "express";
import ical from "ical-generator";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const vehicles = db.prepare("SELECT * FROM vehicles").all();
  res.json(vehicles);
});

router.get("/:id/bookings", (req, res) => {
  const { id } = req.params;
  const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  const bookings = db
    .prepare("SELECT * FROM bookings WHERE vehicle_id = ? ORDER BY start_date")
    .all(id);
  res.json(bookings);
});

router.get("/:id/calendar.ics", (req, res) => {
  const { id } = req.params;
  const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  const bookings = db
    .prepare("SELECT * FROM bookings WHERE vehicle_id = ? ORDER BY start_date")
    .all(id);

  const calendar = ical({ name: `${vehicle.name} bookings` });
  for (const booking of bookings) {
    calendar.createEvent({
      start: new Date(`${booking.start_date}T00:00:00Z`),
      end: new Date(`${booking.end_date}T00:00:00Z`),
      allDay: true,
      summary: `Booked (${booking.source})`,
      description: `Renter: ${booking.renter_name}, status: ${booking.status}`,
      id: booking.external_uid || `direct-booking-${booking.id}`,
    });
  }

  res.set("Content-Type", "text/calendar");
  res.send(calendar.toString());
});

export default router;
