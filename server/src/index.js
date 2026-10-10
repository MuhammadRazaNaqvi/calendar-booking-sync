import express from "express";
import cors from "cors";
import "./db.js";
import vehiclesRouter from "./routes/vehicles.js";
import bookingsRouter from "./routes/bookings.js";
import syncTuroRouter from "./routes/sync-turo.js";
import { pathToFileURL, fileURLToPath } from "node:url";

export const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/mock-turo", (req, res) => {
  res.sendFile(fileURLToPath(new URL("../public/mock-turo.html", import.meta.url)));
});

app.use("/api/vehicles", vehiclesRouter);
app.use("/api/vehicles", syncTuroRouter);
app.use("/api/bookings", bookingsRouter);


app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status === 400 ? 400 : 500;
  res.status(status).json({ error: status === 400 ? "Invalid request body" : "Unable to complete request. Check the server and retry." });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}
