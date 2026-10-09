import express from "express";
import cors from "cors";
import "./db.js";
import vehiclesRouter from "./routes/vehicles.js";
import bookingsRouter from "./routes/bookings.js";
import syncTuroRouter from "./routes/sync-turo.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/vehicles", vehiclesRouter);
app.use("/api/vehicles", syncTuroRouter);
app.use("/api/bookings", bookingsRouter);


app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
