import { Router } from "express";
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

export default router;
