import axios from "axios";

const API_BASE = "http://localhost:4000";

const client = axios.create({ baseURL: API_BASE });

export function getVehicles() {
  return client.get("/api/vehicles").then((res) => res.data);
}

export function getBookings(vehicleId) {
  return client.get(`/api/vehicles/${vehicleId}/bookings`).then((res) => res.data);
}

export function createBooking(payload) {
  return client.post("/api/bookings", payload).then((res) => res.data);
}

export function syncTuro(vehicleId) {
  return client.post(`/api/vehicles/${vehicleId}/sync-turo`).then((res) => res.data);
}

export function calendarIcsUrl(vehicleId) {
  return `${API_BASE}/api/vehicles/${vehicleId}/calendar.ics`;
}
